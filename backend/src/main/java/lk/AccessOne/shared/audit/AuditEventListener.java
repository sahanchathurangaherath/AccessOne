package lk.AccessOne.shared.audit;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
public class AuditEventListener {

    private final AuditLogRepository auditLogRepository;
    private final CurrentUserProvider currentUser;

    public AuditEventListener(AuditLogRepository auditLogRepository,
                              CurrentUserProvider currentUser) {
        this.auditLogRepository = auditLogRepository;
        this.currentUser = currentUser;
    }

    /**
     * AFTER_COMMIT: the audit row is written only if the business change
     * actually succeeded. REQUIRES_NEW because the original transaction has
     * already committed by the time this runs.
     */
    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void on(AuditEvent event) {
        auditLogRepository.save(new AuditLog(
                event.entityName(),
                event.entityId(),
                event.action(),
                event.oldValue(),
                event.newValue(),
                currentUser.currentUserId(),
                currentUser.currentUsername()
        ));
    }
}
