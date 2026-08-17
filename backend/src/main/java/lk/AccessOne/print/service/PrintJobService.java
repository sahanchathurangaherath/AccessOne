package lk.AccessOne.print.service;

import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.repository.IdCardRepository;
import lk.AccessOne.card.service.CardPdf;
import lk.AccessOne.card.service.CardService;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.identity.security.AccessOneUserDetails;
import lk.AccessOne.print.domain.PrintJob;
import lk.AccessOne.print.event.PrintQualityFailed;
import lk.AccessOne.print.repository.PrintJobRepository;
import lk.AccessOne.print.repository.ProductionReportRepository;
import lk.AccessOne.print.web.dto.PrintJobDetail;
import lk.AccessOne.print.web.dto.PrintJobRow;
import lk.AccessOne.print.web.dto.ReprintRateDto;
import lk.AccessOne.print.web.dto.ThroughputDto;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.StatusChangeSupport;
import lk.AccessOne.shared.enums.CardStatus;
import lk.AccessOne.shared.enums.PrintJobType;
import lk.AccessOne.shared.enums.PrintStatus;
import lk.AccessOne.shared.enums.QcResult;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumSet;
import java.util.List;

@Service
public class PrintJobService {

    private static final EnumSet<PrintStatus> CLOSED_STATUSES =
            EnumSet.of(PrintStatus.CANCELLED, PrintStatus.QC_FAILED);

    private final PrintJobRepository printJobs;
    private final IdCardRepository cards;
    private final ProductionReportRepository reports;
    private final PrintJobNumberGenerator jobNumbers;
    private final PrintMapper mapper;
    private final EntityLookup lookup;
    private final StatusChangeSupport statusChanges;
    private final ApplicationEventPublisher events;
    private final UserRepository users;
    private final CardService cardService;

    public PrintJobService(PrintJobRepository printJobs, IdCardRepository cards,
                            ProductionReportRepository reports, PrintJobNumberGenerator jobNumbers,
                            PrintMapper mapper, EntityLookup lookup, StatusChangeSupport statusChanges,
                            ApplicationEventPublisher events, UserRepository users,
                            CardService cardService) {
        this.printJobs = printJobs;
        this.cards = cards;
        this.reports = reports;
        this.jobNumbers = jobNumbers;
        this.mapper = mapper;
        this.lookup = lookup;
        this.statusChanges = statusChanges;
        this.events = events;
        this.users = users;
        this.cardService = cardService;
    }

    // ---------- read ----------

    @Transactional(readOnly = true)
    public PageResponse<PrintJobRow> queue(PrintStatus status, Pageable pageable) {
        return PageResponse.of(printJobs.search(status, pageable), mapper::toRow);
    }

    @Transactional(readOnly = true)
    public PrintJobDetail findById(Long id) {
        return mapper.toDetail(lookup.require(printJobs.findDetailById(id), "Print job", id));
    }

    @Transactional(readOnly = true)
    public CardPdf printFile(Long jobId) {
        PrintJob job = lookup.require(printJobs, jobId, "Print job");
        return cardService.pdf(job.getCard().getId());
    }

    @Transactional(readOnly = true)
    public List<ReprintRateDto> reprintRate(LocalDateTime fromDate) {
        return reports.reprintRateByDepartment(fromDate).stream().map(mapper::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ThroughputDto> throughput() {
        return reports.dailyThroughput().stream().map(mapper::toDto).toList();
    }

    // ---------- production ----------

    @Transactional
    public PrintJobDetail queueJob(Long cardId) {
        IdCard card = lookup.require(cards, cardId, "Card");

        // No second open job for the same card. A reprint is only created
        // after a QC failure, through reprint(), never by queueing again.
        if (printJobs.existsByCardIdAndStatusNotIn(cardId, CLOSED_STATUSES)) {
            throw new BusinessRuleException("JOB_ALREADY_OPEN",
                "This card already has a job in the queue.");
        }

        PrintJob job = printJobs.save(
                PrintJob.queue(jobNumbers.next(), card, PrintJobType.INITIAL, actingUser()));

        // Module 4 owns the card state machine. Go through moveTo() so the
        // transition rules stay in one place.
        statusChanges.apply("id_cards", cardId, card::getStatus,
                () -> card.moveTo(CardStatus.QUEUED_FOR_PRINT));

        events.publishEvent(AuditEvent.created("print_jobs", job.getId(),
                "{\"job_no\":\"%s\",\"type\":\"INITIAL\"}".formatted(job.getJobNo())));

        return mapper.toDetail(job);
    }

    @Transactional
    public PrintJobDetail start(Long jobId, String printerName) {
        PrintJob job = lookup.require(printJobs, jobId, "Print job");
        statusChanges.apply("print_jobs", jobId, job::getStatus, () -> job.start(printerName));
        return mapper.toDetail(job);
    }

    @Transactional
    public PrintJobDetail markPrinted(Long jobId) {
        PrintJob job = lookup.require(printJobs, jobId, "Print job");

        statusChanges.apply("print_jobs", jobId, job::getStatus, job::markPrinted);

        IdCard card = job.getCard();
        statusChanges.apply("id_cards", card.getId(), card::getStatus,
                () -> card.moveTo(CardStatus.PRINTED));

        return mapper.toDetail(job);
    }

    @Transactional
    public PrintJobDetail recordQualityCheck(Long jobId, QcResult result, String notes) {
        PrintJob job = lookup.require(printJobs, jobId, "Print job");

        statusChanges.apply("print_jobs", jobId, job::getStatus,
                () -> job.recordQualityCheck(result, notes));

        if (result == QcResult.FAIL) {
            // The failed job stays as a record. The reprint is a new job.
            events.publishEvent(new PrintQualityFailed(jobId, job.getCard().getId(), notes));
        }
        return mapper.toDetail(job);
    }

    /**
     * A reprint is a new job against the same card, never an edit of the
     * old one. The failed attempt is part of the production record and is
     * what the reprint rate is calculated from.
     */
    @Transactional
    public PrintJobDetail reprint(Long failedJobId, String reason) {
        PrintJob failed = lookup.require(printJobs, failedJobId, "Print job");

        if (failed.getStatus() != PrintStatus.QC_FAILED) {
            throw new BusinessRuleException("NOT_FAILED",
                "Only a job that failed its quality check can be reprinted.");
        }

        IdCard card = failed.getCard();
        PrintJob reprint = printJobs.save(
                PrintJob.queue(jobNumbers.next(), card, PrintJobType.REPRINT, actingUser()));

        // PRINTED -> QUEUED_FOR_PRINT is a legal transition in CardStatus,
        // which is what makes a reprint possible without voiding the card.
        statusChanges.apply("id_cards", card.getId(), card::getStatus,
                () -> card.moveTo(CardStatus.QUEUED_FOR_PRINT));

        events.publishEvent(AuditEvent.created("print_jobs", reprint.getId(),
                "{\"job_no\":\"%s\",\"reprint_of\":\"%s\",\"reason\":\"%s\"}"
                    .formatted(reprint.getJobNo(), failed.getJobNo(), reason)));

        return mapper.toDetail(reprint);
    }

    @Transactional
    public PrintJobDetail cancel(Long jobId, String reason) {
        PrintJob job = lookup.require(printJobs, jobId, "Print job");

        statusChanges.apply("print_jobs", jobId, job::getStatus, () -> job.cancel(reason));

        // The card goes back to GENERATED so it can be queued again.
        IdCard card = job.getCard();
        if (card.getStatus() == CardStatus.QUEUED_FOR_PRINT) {
            statusChanges.apply("id_cards", card.getId(), card::getStatus,
                    () -> card.moveTo(CardStatus.GENERATED));
        }
        return mapper.toDetail(job);
    }

    private User actingUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AccessOneUserDetails details) {
            return users.getReferenceById(details.getUserId());
        }
        throw new BusinessRuleException("NO_ACTING_USER", "No authenticated user to record this action against.");
    }
}
