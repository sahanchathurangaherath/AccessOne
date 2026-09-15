package lk.AccessOne.shared.audit;

import java.time.LocalDateTime;

public record AuditLogRow(
        Long id, String entityName, Long entityId, String action,
        String oldValue, String newValue,
        String performedByUsername, String ipAddress, LocalDateTime performedAt
) {
    public static AuditLogRow from(AuditLog log) {
        return new AuditLogRow(
                log.getId(), log.getEntityName(), log.getEntityId(), log.getAction().name(),
                log.getOldValue(), log.getNewValue(),
                log.getPerformedByUsername(), log.getIpAddress(), log.getPerformedAt());
    }
}
