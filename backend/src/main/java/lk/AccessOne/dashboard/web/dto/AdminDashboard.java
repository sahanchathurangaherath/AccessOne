package lk.AccessOne.dashboard.web.dto;

import java.time.LocalDateTime;
import java.util.List;

public record AdminDashboard(
        long users, long auditEntriesToday, long failedLogins, List<AuditActivityRow> recentActivity) {

    public record AuditActivityRow(
            String entityName, Long entityId, String action,
            String performedBy, LocalDateTime performedAt) { }
}
