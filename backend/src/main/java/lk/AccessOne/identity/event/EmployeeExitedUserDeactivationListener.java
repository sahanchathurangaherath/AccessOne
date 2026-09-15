package lk.AccessOne.identity.event;

import lk.AccessOne.approval.event.EmployeeExited;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.AuditValue;
import lk.AccessOne.shared.enums.AuditAction;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Card revocation (Module 4) and pending-request cancellation already
 * subscribe to EmployeeExited. This is the third, missing consequence:
 * deactivating the login itself. AccessOneUserDetails#isEnabled() reads
 * User.active, so this is what actually blocks the next login attempt.
 */
@Component
public class EmployeeExitedUserDeactivationListener {

    private final UserRepository users;
    private final ApplicationEventPublisher events;

    public EmployeeExitedUserDeactivationListener(UserRepository users, ApplicationEventPublisher events) {
        this.users = users;
        this.events = events;
    }

    @EventListener
    @Transactional
    public void on(EmployeeExited event) {
        users.findByEmployeeIdAndActiveTrue(event.employeeId()).ifPresent(user -> {
            user.deactivate();
            events.publishEvent(new AuditEvent("users", user.getId(), AuditAction.STATUS_CHANGE,
                    null, AuditValue.of().with("active", false).with("reason", event.reason()).json()));
        });
    }
}
