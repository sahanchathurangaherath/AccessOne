package lk.AccessOne.shared.audit;

import lk.AccessOne.shared.enums.AuditAction;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Component;

import java.util.function.Supplier;

/**
 * Capture the status, run the change, publish the audit event. Every status
 * change in every module is these three steps, and the one that gets
 * forgotten is the audit event -- which is exactly the one nobody notices
 * until the trail is needed.
 */
@Component
public class StatusChangeSupport {

    private final ApplicationEventPublisher events;

    public StatusChangeSupport(ApplicationEventPublisher events) {
        this.events = events;
    }

    public <S> void apply(String entityName, Long entityId,
                          Supplier<S> currentStatus, Runnable change) {
        apply(entityName, entityId, AuditAction.STATUS_CHANGE, currentStatus, change);
    }

    /**
     * Same capture-run-publish shape, but for a transition the schema gives
     * a sharper name than STATUS_CHANGE -- APPROVE, REJECT, REVOKE. Using
     * the specific action makes the trail filterable by what actually
     * happened rather than by which column moved.
     */
    public <S> void apply(String entityName, Long entityId, AuditAction action,
                          Supplier<S> currentStatus, Runnable change) {
        S from = currentStatus.get();
        change.run();
        S to = currentStatus.get();
        if (!from.equals(to)) {
            events.publishEvent(AuditEvent.statusChanged(entityName, entityId, action, from, to));
        }
    }
}
