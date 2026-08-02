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
        return new AuditEvent(entityName, id, AuditAction.STATUS_CHANGE,
                "{\"status\":\"%s\"}".formatted(from),
                "{\"status\":\"%s\"}".formatted(to));
    }
}
