package lk.AccessOne.shared.audit;

import lk.AccessOne.shared.enums.AuditAction;

public record AuditEvent(
        String entityName,
        Long entityId,
        AuditAction action,
        String oldValue,
        String newValue
) {
    public static AuditEvent created(String entityName, Long id, String newValue) {
        return new AuditEvent(entityName, id, AuditAction.CREATE, null, newValue);
    }

    public static AuditEvent statusChanged(String entityName, Long id,
                                           Object from, Object to) {
        return statusChanged(entityName, id, AuditAction.STATUS_CHANGE, from, to);
    }

    /**
     * For the transitions the schema gives a sharper name than
     * STATUS_CHANGE -- APPROVE, REJECT, REVOKE -- so the trail is
     * filterable by what actually happened, not just which column moved.
     */
    public static AuditEvent statusChanged(String entityName, Long id, AuditAction action,
                                           Object from, Object to) {
        return new AuditEvent(entityName, id, action,
                AuditValue.status(from), AuditValue.status(to));
    }
}
