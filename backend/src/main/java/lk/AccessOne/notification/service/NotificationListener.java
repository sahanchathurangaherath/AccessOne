package lk.AccessOne.notification.service;

import lk.AccessOne.approval.event.CardRequestApproved;
import lk.AccessOne.approval.event.CardRequestRejected;
import lk.AccessOne.card.event.CardRevoked;
import lk.AccessOne.cardrequest.event.CardRequestSubmitted;
import lk.AccessOne.entry.event.SecurityAlertRaised;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.notification.service.EmailService;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.organisation.repository.EmployeeRepository;
import lk.AccessOne.print.event.CardActivated;
import lk.AccessOne.print.event.CardDispatched;
import lk.AccessOne.print.event.CardPrinted;
import lk.AccessOne.shared.enums.AlertSeverity;
import lk.AccessOne.shared.enums.NotificationType;
import lk.AccessOne.visitor.event.PassExpiringSoon;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.time.format.DateTimeFormatter;
import java.util.Map;

/**
 * Every listener here is AFTER_COMMIT. Telling someone their request was
 * approved when the transaction then rolled back is worse than silence.
 * REQUIRES_NEW because the transaction that made the change has already
 * committed by the time this runs.
 *
 * No service that publishes these events needed to change -- this is the
 * Observer payoff.
 */
@Component
public class NotificationListener {

    private final NotificationService notifications;
    private final UserRepository users;
    private final EmployeeRepository employees;
    private final EmailService emailService;
    private final String portalBaseUrl;

    public NotificationListener(NotificationService notifications,
                                UserRepository users,
                                EmployeeRepository employees,
                                EmailService emailService,
                                @Value("${accessone.mail.portal-base-url:http://localhost:3000}") String portalBaseUrl) {
        this.notifications = notifications;
        this.users = users;
        this.employees = employees;
        this.emailService = emailService;
        this.portalBaseUrl = portalBaseUrl;
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CardRequestSubmitted event) {
        notifyRole("HR_MANAGER", NotificationType.REQUEST_SUBMITTED,
                "New card request",
                "A card request is waiting for verification.",
                "card_requests", event.requestId(), "/hr");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CardRequestApproved event) {
        notifyEmployee(event.employeeId(), NotificationType.REQUEST_APPROVED,
                "Card request approved",
                "Your request has been approved. Your card is being produced.",
                "card_requests", event.requestId(),
                "/employee/requests/" + event.requestId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CardRequestRejected event) {
        notifyEmployee(event.employeeId(), NotificationType.REQUEST_REJECTED,
                "Card request needs attention",
                // The reason, not just the outcome -- the employee has to
                // know what to correct before resubmitting.
                event.reason(),
                "card_requests", event.requestId(),
                "/employee/requests/" + event.requestId());
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CardPrinted event) {
        notifyEmployee(event.employeeId(), NotificationType.CARD_ACTIVATED,
                "Card printed & ready",
                "Your card (%s) has been printed and is ready for collection or dispatch."
                        .formatted(event.cardSerial()),
                "id_cards", event.cardId(), "/employee");

        sendCardStatusEmail(event.employeeId(),
                "AccessOne ID Card Ready for Collection",
                "READY FOR COLLECTION",
                "Great news! Your official employee smart ID card has been printed and passed quality verification.",
                event.cardSerial(),
                "COLLECTION (Front Desk)",
                "Please visit the corporate security reception or front desk to collect your physical card.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CardDispatched event) {
        notifyEmployee(event.employeeId(), NotificationType.CARD_ACTIVATED,
                "Card dispatched",
                "Your card (%s) has been dispatched via %s."
                        .formatted(event.cardSerial(), event.dispatchMethod()),
                "id_cards", event.cardId(), "/employee");

        sendCardStatusEmail(event.employeeId(),
                "AccessOne ID Card Dispatched",
                "CARD DISPATCHED",
                "Your smart ID badge is on its way.",
                event.cardSerial(),
                event.dispatchMethod() != null ? event.dispatchMethod().name() : "STANDARD DISPATCH",
                event.remarks() != null && !event.remarks().isBlank() ? event.remarks() : "Your card has been dispatched according to the assigned distribution method.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CardActivated event) {
        notifyEmployee(event.receiverId(), NotificationType.CARD_ACTIVATED,
                "Your card is active",
                "Card %s is now active and will open the doors your access level permits."
                    .formatted(event.cardSerial()),
                "id_cards", event.cardId(), null);

        sendCardStatusEmail(event.receiverId(),
                "AccessOne ID Card Activated",
                "CARD ACTIVE",
                "Your smart ID card has been handed over and activated in the Access Control System.",
                event.cardSerial(),
                "IN-PERSON HANDOVER",
                "Your card is active and can now be used at all authorized door readers and access checkpoints.");
    }

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(CardRevoked event) {
        notifyEmployee(event.employeeId(), NotificationType.CARD_REVOKED,
                "Your card has been revoked",
                event.reason(),
                "id_cards", event.cardId(), null);
    }

    /** Security officers, not one employee. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(SecurityAlertRaised event) {
        if (event.severity() == AlertSeverity.LOW) return;   // dashboard only

        notifyRole("SECURITY_OFFICER", NotificationType.SECURITY_ALERT,
                "%s alert".formatted(event.severity().name().toLowerCase()),
                event.message(), "security_alerts", event.alertId(), "/security");
    }

    private static final DateTimeFormatter TIME = DateTimeFormatter.ofPattern("HH:mm");

    /** The host, not the visitor -- the host is the accountable party and can see them out. */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(PassExpiringSoon event) {
        notifyEmployee(event.hostEmployeeId(), NotificationType.PASS_EXPIRING,
                "Visitor pass expiring",
                "%s's pass expires at %s. Please see them out."
                    .formatted(event.visitorName(), event.validUntil().format(TIME)),
                "visitor_passes", event.passId(), "/security/passes/" + event.passId());
    }

    private void notifyEmployee(Long employeeId, NotificationType type, String title,
                                String message, String entity, Long entityId, String path) {
        // An employee without a login gets no notification, and that is
        // fine -- it is not an error worth failing anything over.
        users.findByEmployeeIdAndActiveTrue(employeeId).ifPresent(user ->
                notifications.create(user.getId(), type, title, message, entity, entityId, path));
    }

    private void notifyRole(String roleName, NotificationType type, String title,
                            String message, String entity, Long entityId, String path) {
        for (User user : users.findByRoleRoleNameAndActiveTrue(roleName)) {
            notifications.create(user.getId(), type, title, message, entity, entityId, path);
        }
    }

    private void sendCardStatusEmail(Long employeeId, String subject, String statusBadge,
                                     String headlineMessage, String cardSerial,
                                     String dispatchMethod, String instructions) {
        employees.findById(employeeId).ifPresent(employee -> {
            if (employee.getEmail() != null && !employee.getEmail().isBlank()) {
                emailService.sendHtmlEmail(
                        employee.getEmail(),
                        subject,
                        "card-status-update",
                        Map.of(
                                "employeeName", employee.getFullName(),
                                "headlineMessage", headlineMessage,
                                "statusBadge", statusBadge,
                                "cardSerial", cardSerial != null ? cardSerial : "",
                                "dispatchMethod", dispatchMethod != null ? dispatchMethod : "",
                                "instructions", instructions,
                                "portalUrl", portalBaseUrl + "/employee"
                        )
                );
            }
        });
    }
}
