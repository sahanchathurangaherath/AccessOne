package lk.AccessOne.shared.audit;

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
        S from = currentStatus.get();
        change.run();
        S to = currentStatus.get();
        if (!from.equals(to)) {
            events.publishEvent(AuditEvent.statusChanged(entityName, entityId, from, to));
        }
    }
}
