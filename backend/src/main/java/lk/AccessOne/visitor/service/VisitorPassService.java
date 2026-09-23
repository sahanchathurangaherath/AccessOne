package lk.AccessOne.visitor.service;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.repository.AccessLevelRepository;
import lk.AccessOne.card.service.QrCodeService;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.notification.service.EmailService;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.AuditValue;
import lk.AccessOne.shared.audit.CurrentUserProvider;
import lk.AccessOne.shared.audit.StatusChangeSupport;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.PassStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.sequence.SequenceGenerator;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.web.PageResponse;
import lk.AccessOne.visitor.domain.Visitor;
import lk.AccessOne.visitor.domain.VisitorPass;
import lk.AccessOne.visitor.repository.VisitLogRepository;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import lk.AccessOne.visitor.repository.VisitorRepository;
import lk.AccessOne.visitor.web.dto.IssuePassInput;
import lk.AccessOne.visitor.web.dto.PassDetail;
import lk.AccessOne.visitor.web.dto.PassRow;
import lk.AccessOne.visitor.web.dto.PassVerification;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.EnumSet;
import java.util.Map;

@Service
public class VisitorPassService {

    private static final DateTimeFormatter DATE_TIME = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    /** Statuses that still occupy the one-live-pass-per-visitor slot. */
    private static final EnumSet<PassStatus> LIVE_STATUSES =
            EnumSet.of(PassStatus.ISSUED, PassStatus.ACTIVE, PassStatus.SUSPENDED);

    private final VisitorRepository visitors;
    private final VisitorPassRepository passes;
    private final VisitLogRepository visitLogs;
    private final EmployeeRepository employees;
    private final AccessLevelRepository accessLevels;
    private final UserRepository users;
    private final QrCodeService qrCodes;
    private final VisitorPassPdfService passPdfService;
    private final EmailService emailService;
    private final VisitorMapper mapper;
    private final EntityLookup lookup;
    private final StatusChangeSupport statusChanges;
    private final CurrentUserProvider currentUser;
    private final ApplicationEventPublisher events;
    private final SequenceGenerator sequences;
    private final String qrBaseUrl;

    public VisitorPassService(VisitorRepository visitors, VisitorPassRepository passes,
                               VisitLogRepository visitLogs, EmployeeRepository employees,
                               AccessLevelRepository accessLevels, UserRepository users,
                               QrCodeService qrCodes, VisitorPassPdfService passPdfService,
                               EmailService emailService, VisitorMapper mapper, EntityLookup lookup,
                               StatusChangeSupport statusChanges, CurrentUserProvider currentUser,
                               ApplicationEventPublisher events, SequenceGenerator sequences,
                               @Value("${accessone.credentials.qr-base-url}") String qrBaseUrl) {
        this.visitors = visitors;
        this.passes = passes;
        this.visitLogs = visitLogs;
        this.employees = employees;
        this.accessLevels = accessLevels;
        this.users = users;
        this.qrCodes = qrCodes;
        this.passPdfService = passPdfService;
        this.emailService = emailService;
        this.mapper = mapper;
        this.lookup = lookup;
        this.statusChanges = statusChanges;
        this.currentUser = currentUser;
        this.events = events;
        this.sequences = sequences;
        this.qrBaseUrl = qrBaseUrl;
    }

    // ---------- read ----------

    @Transactional(readOnly = true)
    public PageResponse<PassRow> search(PassStatus status, Pageable pageable) {
        return PageResponse.of(passes.search(status, pageable), mapper::toRow);
    }

    @Transactional(readOnly = true)
    public PassDetail findById(Long id) {
        return mapper.toDetail(lookup.require(passes.findDetailById(id), "Visitor pass", id));
    }

    @Transactional(readOnly = true)
    public byte[] qrImage(Long id, int size) {
        VisitorPass pass = lookup.require(passes, id, "Visitor pass");
        return qrCodes.png(pass.getQrPayload(), size);
    }

    /**
     * Phase 12's lookup. Returns found=false rather than throwing, because
     * an unrecognised pass is a denied entry attempt to log, not an error.
     */
    @Transactional(readOnly = true)
    public PassVerification verifyByPassNo(String passNo) {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        return passes.findByPassNoForDecision(passNo)
                .map(p -> mapper.toVerification(p, now))
                .orElse(PassVerification.unknown(passNo));
    }

    // ---------- write ----------

    @Transactional
    public PassDetail issue(IssuePassInput input) {
        Visitor visitor = lookup.require(visitors, input.visitorId(), "Visitor");
        if (visitor.isDeleted()) {
            throw new BusinessRuleException("VISITOR_DELETED",
                "This visitor record has been removed. Restore it before issuing a pass.");
        }

        Employee host = lookup.require(employees, input.hostEmployeeId(), "Host employee");
        if (!host.isActivelyEmployed()) {
            throw new BusinessRuleException("HOST_NOT_ACTIVE", "The host is no longer employed here.");
        }

        AccessLevel level = lookup.require(accessLevels, input.accessLevelId(), "Access level");
        if (!level.isActive()) {
            throw new BusinessRuleException("LEVEL_INACTIVE",
                "%s is deactivated and cannot be issued.".formatted(level.getLevelName()));
        }

        // Two live passes for one visitor means two working credentials.
        passes.findFirstByVisitorIdAndStatusIn(input.visitorId(), LIVE_STATUSES).ifPresent(existing -> {
            throw new BusinessRuleException("PASS_ALREADY_LIVE",
                "%s already holds pass %s, valid until %s."
                    .formatted(visitor.getFullName(), existing.getPassNo(), existing.getValidUntil()));
        });

        String passNo = nextPassNo();
        VisitorPass pass = passes.save(VisitorPass.issue(
                passNo, visitor, host, level, input.purpose(),
                input.validFrom(), input.validUntil(),
                qrBaseUrl + "/pass/" + passNo, actingUser()));

        events.publishEvent(AuditEvent.created("visitor_passes", pass.getId(),
                AuditValue.of().with("pass_no", passNo).with("valid_until", input.validUntil()).json()));

        if (visitor.getEmail() != null && !visitor.getEmail().isBlank()) {
            try {
                byte[] pdfBytes = passPdfService.render(pass);
                String attachmentName = "VisitorPass-" + pass.getPassNo() + ".pdf";
                emailService.sendHtmlEmailWithAttachment(
                        visitor.getEmail(),
                        "AccessOne Digital Visitor Pass - " + pass.getPassNo(),
                        "visitor-pass-issued",
                        Map.of(
                                "visitorName", visitor.getFullName(),
                                "passNo", pass.getPassNo(),
                                "hostName", host.getFullName(),
                                "purpose", pass.getPurpose(),
                                "validFrom", pass.getValidFrom().format(DATE_TIME),
                                "validUntil", pass.getValidUntil().format(DATE_TIME),
                                "accessLevelName", level.getLevelName(),
                                "attachmentName", attachmentName
                        ),
                        attachmentName,
                        pdfBytes,
                        "application/pdf"
                );
            } catch (Exception ignored) {
                // Non-blocking: Pass issuance transaction must not fail if SMTP is unreachable
            }
        }

        return mapper.toDetail(pass);
    }

    @Transactional
    public PassDetail extend(Long passId, LocalDateTime newUntil, String reason) {
        VisitorPass pass = lookup.require(passes, passId, "Visitor pass");
        LocalDateTime before = pass.getValidUntil();

        pass.changeWindow(newUntil);

        // Record both times, not just that a change happened. "Extended
        // by whom, from what, to what" is the question this answers.
        events.publishEvent(new AuditEvent("visitor_passes", passId, AuditAction.UPDATE,
                AuditValue.of().with("valid_until", before).json(),
                AuditValue.of().with("valid_until", newUntil).with("reason", reason).json()));

        if (pass.getVisitor().getEmail() != null && !pass.getVisitor().getEmail().isBlank()) {
            try {
                emailService.sendHtmlEmail(
                        pass.getVisitor().getEmail(),
                        "AccessOne Visitor Pass Validity Extended - " + pass.getPassNo(),
                        "visitor-pass-extended",
                        Map.of(
                                "visitorName", pass.getVisitor().getFullName(),
                                "passNo", pass.getPassNo(),
                                "newValidUntil", newUntil.format(DATE_TIME),
                                "reason", reason != null ? reason : ""
                        )
                );
            } catch (Exception ignored) {
                // Non-blocking
            }
        }

        return mapper.toDetail(pass);
    }

    @Transactional
    public PassDetail suspend(Long passId) {
        VisitorPass pass = lookup.require(passes, passId, "Visitor pass");
        statusChanges.apply("visitor_passes", passId, pass::getStatus, pass::suspend);
        return mapper.toDetail(pass);
    }

    @Transactional
    public PassDetail reinstate(Long passId) {
        VisitorPass pass = lookup.require(passes, passId, "Visitor pass");
        statusChanges.apply("visitor_passes", passId, pass::getStatus, pass::reinstate);
        return mapper.toDetail(pass);
    }

    @Transactional
    public PassDetail markReturned(Long passId) {
        VisitorPass pass = lookup.require(passes, passId, "Visitor pass");
        statusChanges.apply("visitor_passes", passId, pass::getStatus, pass::markReturned);
        return mapper.toDetail(pass);
    }

    @Transactional
    public PassDetail cancel(Long passId, String reason) {
        VisitorPass pass = lookup.require(passes, passId, "Visitor pass");
        statusChanges.apply("visitor_passes", passId, pass::getStatus, () -> pass.cancel(reason));

        // A cancelled pass must not leave someone on the on-site board.
        visitLogs.findOpenForPass(passId).ifPresent(
                log -> log.closeAt(LocalDateTime.now(ZoneOffset.UTC), "Auto-closed: pass cancelled"));
        return mapper.toDetail(pass);
    }

    private String nextPassNo() {
        return sequences.next("dbo.seq_pass_no", "VP", 4);
    }

    private User actingUser() {
        return users.getReferenceById(currentUser.currentUserId());
    }
}
