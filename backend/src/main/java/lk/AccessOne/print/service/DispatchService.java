package lk.AccessOne.print.service;

import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.print.domain.DispatchRecord;
import lk.AccessOne.print.domain.PrintJob;
import lk.AccessOne.print.event.CardActivated;
import lk.AccessOne.print.repository.DispatchRecordRepository;
import lk.AccessOne.print.repository.PrintJobRepository;
import lk.AccessOne.print.web.dto.DispatchDetail;
import lk.AccessOne.print.web.dto.DispatchRow;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.StatusChangeSupport;
import lk.AccessOne.shared.enums.CardStatus;
import lk.AccessOne.shared.enums.DispatchMethod;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.storage.FileStorageService;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class DispatchService {

    private final DispatchRecordRepository dispatches;
    private final PrintJobRepository printJobs;
    private final EmployeeRepository employees;
    private final FileStorageService storage;
    private final PrintMapper mapper;
    private final EntityLookup lookup;
    private final StatusChangeSupport statusChanges;
    private final ApplicationEventPublisher events;

    public DispatchService(DispatchRecordRepository dispatches, PrintJobRepository printJobs,
                            EmployeeRepository employees, FileStorageService storage,
                            PrintMapper mapper, EntityLookup lookup, StatusChangeSupport statusChanges,
                            ApplicationEventPublisher events) {
        this.dispatches = dispatches;
        this.printJobs = printJobs;
        this.employees = employees;
        this.storage = storage;
        this.mapper = mapper;
        this.lookup = lookup;
        this.statusChanges = statusChanges;
        this.events = events;
    }

    @Transactional(readOnly = true)
    public PageResponse<DispatchRow> list(Pageable pageable) {
        return PageResponse.of(dispatches.findAllDetailed(pageable), mapper::toRow);
    }

    @Transactional(readOnly = true)
    public DispatchDetail findById(Long id) {
        return mapper.toDetail(lookup.require(dispatches.findDetailById(id), "Dispatch record", id));
    }

    @Transactional
    public DispatchDetail open(Long jobId, DispatchMethod method, String remarks) {
        PrintJob job = lookup.require(printJobs, jobId, "Print job");

        dispatches.findByPrintJobId(jobId).ifPresent(existing -> {
            throw new BusinessRuleException("ALREADY_DISPATCHED",
                "A dispatch record already exists for this job.");
        });

        DispatchRecord record = dispatches.save(DispatchRecord.open(job, method, remarks));

        events.publishEvent(AuditEvent.created("dispatch_records", record.getId(),
                "{\"method\":\"%s\"}".formatted(method)));
        return mapper.toDetail(record);
    }

    @Transactional
    public DispatchDetail dispatch(Long dispatchId) {
        DispatchRecord record = lookup.require(dispatches, dispatchId, "Dispatch record");

        statusChanges.apply("dispatch_records", dispatchId, record::getStatus, record::dispatch);

        IdCard card = record.getPrintJob().getCard();
        statusChanges.apply("id_cards", card.getId(), card::getStatus,
                () -> card.moveTo(CardStatus.DISPATCHED));

        return mapper.toDetail(record);
    }

    /**
     * Handover, and activation, in one transaction.
     *
     * The card becomes usable at the moment a named person takes it -- not
     * when a batch arrived in an office. That is the tighter control and
     * it is what this module is judged on.
     */
    @Transactional
    public DispatchDetail recordHandover(Long dispatchId, Long receiverId, MultipartFile signature) {
        DispatchRecord record = lookup.require(dispatches, dispatchId, "Dispatch record");
        PrintJob job = record.getPrintJob();
        IdCard card = job.getCard();

        // A card that was never printed cannot be handed over. Enforced
        // here, not by hiding a button -- a direct API call hits this too.
        if (!job.wasPrinted()) {
            throw new BusinessRuleException("NOT_PRINTED",
                "This card has not been recorded as printed, so it cannot be "
              + "handed over or activated.");
        }

        requireCorrectRecipient(card, receiverId);

        Employee receiver = lookup.require(employees, receiverId, "Employee");
        String signaturePath = signature == null || signature.isEmpty() ? null
                : storage.store("handovers", dispatchId, signature,
                                FileStorageService.IMAGES, 2L * 1024 * 1024);

        statusChanges.apply("dispatch_records", dispatchId, record::getStatus,
                () -> record.recordHandover(receiver, signaturePath));

        // The activation. chk_id_cards_activation requires activated_at,
        // and IdCard.activate() sets both together.
        statusChanges.apply("id_cards", card.getId(), card::getStatus, card::activate);

        events.publishEvent(new CardActivated(card.getId(), card.getCardSerial(), receiver.getId()));

        return mapper.toDetail(record);
    }

    /**
     * The card belongs to the employee named on it. Handing it to anyone
     * else is exactly the failure that activating-at-handover prevents.
     */
    private void requireCorrectRecipient(IdCard card, Long receiverId) {
        if (!card.getEmployee().getId().equals(receiverId)) {
            throw new BusinessRuleException("WRONG_RECIPIENT",
                "This card was issued to %s. It can only be handed to them."
                    .formatted(card.getPrintedName()));
        }
    }

    @Transactional
    public DispatchDetail markReturned(Long dispatchId, String reason) {
        DispatchRecord record = lookup.require(dispatches, dispatchId, "Dispatch record");
        statusChanges.apply("dispatch_records", dispatchId, record::getStatus,
                () -> record.markReturned(reason));
        return mapper.toDetail(record);
    }
}
