package lk.AccessOne.ai.copilot.tools;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.repository.IdCardRepository;
import lk.AccessOne.entry.domain.AccessLog;
import lk.AccessOne.entry.domain.SecurityAlert;
import lk.AccessOne.entry.repository.AccessLogRepository;
import lk.AccessOne.entry.repository.SecurityAlertRepository;
import lk.AccessOne.shared.enums.AlertStatus;
import lk.AccessOne.shared.enums.PassStatus;
import lk.AccessOne.visitor.domain.VisitorPass;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

/**
 * Safe, read-only analytical query tools exposed to the SecOps Copilot.
 * Strictly read-only operations for security auditing and investigation.
 */
@Component
public class SecOpsTools {

    private final VisitorPassRepository visitorPassRepository;
    private final IdCardRepository idCardRepository;
    private final AccessLogRepository accessLogRepository;
    private final SecurityAlertRepository securityAlertRepository;
    private final AreaRepository areaRepository;

    private static final DateTimeFormatter ISO_FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

    public SecOpsTools(
            VisitorPassRepository visitorPassRepository,
            IdCardRepository idCardRepository,
            AccessLogRepository accessLogRepository,
            SecurityAlertRepository securityAlertRepository,
            AreaRepository areaRepository) {
        this.visitorPassRepository = visitorPassRepository;
        this.idCardRepository = idCardRepository;
        this.accessLogRepository = accessLogRepository;
        this.securityAlertRepository = securityAlertRepository;
        this.areaRepository = areaRepository;
    }

    /**
     * Finds active visitors on-site, optionally filtered by building or floor.
     */
    @Transactional(readOnly = true)
    public String findActiveVisitors(String filterFloor) {
        Page<VisitorPass> passes = visitorPassRepository.search(PassStatus.ACTIVE, PageRequest.of(0, 50));
        List<VisitorPass> activeList = passes.getContent();

        if (activeList.isEmpty()) {
            return "No active visitors currently recorded on-site.";
        }

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("| Pass No | Visitor Name | Company | Host Employee | Valid Until |\n"));
        sb.append(String.format("| :--- | :--- | :--- | :--- | :--- |\n"));

        int count = 0;
        for (VisitorPass p : activeList) {
            String vName = p.getVisitor() != null ? p.getVisitor().getFullName() : "Unknown";
            String comp = p.getVisitor() != null && p.getVisitor().getCompany() != null ? p.getVisitor().getCompany() : "-";
            String host = p.getHostEmployee() != null ? p.getHostEmployee().getFirstName() + " " + p.getHostEmployee().getLastName() : "Unassigned";
            String validUntil = p.getValidUntil() != null ? p.getValidUntil().format(ISO_FMT) : "Indefinite";

            sb.append(String.format("| `%s` | **%s** | %s | %s | %s |\n", p.getPassNo(), vName, comp, host, validUntil));
            count++;
        }

        return String.format("**Total Active Visitors: %d**\n\n%s", count, sb);
    }

    /**
     * Generates a complete incident audit trail for a specific card serial number.
     */
    @Transactional(readOnly = true)
    public String getCardAuditSummary(String cardSerial) {
        Optional<IdCard> cardOpt = idCardRepository.findBySerialWithEmployee(cardSerial.trim());
        if (cardOpt.isEmpty()) {
            return String.format("No ID card found matching serial identifier: `%s`.", cardSerial);
        }

        IdCard card = cardOpt.get();
        String empName = card.getEmployee() != null ? card.getEmployee().getFirstName() + " " + card.getEmployee().getLastName() : "Unknown";
        String dept = card.getEmployee() != null && card.getEmployee().getDepartment() != null ? card.getEmployee().getDepartment().getDeptName() : "General";
        String designation = card.getEmployee() != null ? card.getEmployee().getDesignation() : "Staff";
        String accessLevel = card.getAccessLevel() != null ? card.getAccessLevel().getLevelName() : "Unassigned";

        // Fetch recent scans for this card
        Page<AccessLog> recentLogs = accessLogRepository.search(
            card.getCardSerial(), null, null, null, null,
            PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "accessTime"))
        );

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("### Incident Audit Summary: `%s`\n", card.getCardSerial()));
        sb.append(String.format("- **Holder:** %s (%s)\n", empName, designation));
        sb.append(String.format("- **Department:** %s\n", dept));
        sb.append(String.format("- **Card Status:** `%s` (Issued: %s)\n", card.getStatus(), card.getIssueDate()));
        sb.append(String.format("- **Assigned Access Level:** %s\n\n", accessLevel));

        sb.append("#### Recent Scan History (Latest 10 Attempts):\n");
        if (recentLogs.isEmpty()) {
            sb.append("*No recent access events recorded for this credential.*\n");
        } else {
            sb.append("| Time (UTC) | Area | Direction | Decision | Reason |\n");
            sb.append("| :--- | :--- | :--- | :--- | :--- |\n");
            for (AccessLog log : recentLogs.getContent()) {
                String timeStr = log.getAccessTime().format(ISO_FMT);
                String areaName = areaRepository.findById(log.getAreaId()).map(Area::getAreaName).orElse("Area #" + log.getAreaId());
                String badge = log.getDecision().name().equals("GRANTED") ? "✅ GRANTED" : "❌ DENIED";
                String reason = log.getDenialReason() != null ? log.getDenialReason() : "-";
                sb.append(String.format("| %s | %s | %s | %s | %s |\n", timeStr, areaName, log.getDirection(), badge, reason));
            }
        }

        return sb.toString();
    }

    /**
     * Returns real-time security alerts breakdown.
     */
    @Transactional(readOnly = true)
    public String getSecurityAlertsSummary() {
        Page<SecurityAlert> openAlerts = securityAlertRepository.search(AlertStatus.OPEN, PageRequest.of(0, 25));
        List<SecurityAlert> alerts = openAlerts.getContent();

        if (alerts.isEmpty()) {
            return "No OPEN security alerts at this time. All physical entry points operating within normal parameters.";
        }

        Map<String, Long> bySeverity = alerts.stream()
            .collect(Collectors.groupingBy(a -> a.getSeverity().name(), Collectors.counting()));

        StringBuilder sb = new StringBuilder();
        sb.append(String.format("### Active Security Alerts Overview (%d Open Alerts)\n", alerts.size()));
        sb.append(String.format("- 🔴 **Critical:** %d\n", bySeverity.getOrDefault("CRITICAL", 0L)));
        sb.append(String.format("- 🟠 **High:** %d\n", bySeverity.getOrDefault("HIGH", 0L)));
        sb.append(String.format("- 🟡 **Medium / Low:** %d\n\n", bySeverity.getOrDefault("MEDIUM", 0L) + bySeverity.getOrDefault("LOW", 0L)));

        sb.append("#### Priority Alert Incident Queue:\n");
        sb.append("| Severity | Alert Type | Message | Area | Log ID |\n");
        sb.append("| :--- | :--- | :--- | :--- | :--- |\n");

        for (SecurityAlert a : alerts) {
            String areaName = a.getAreaId() != null
                ? areaRepository.findById(a.getAreaId()).map(Area::getAreaName).orElse("Area #" + a.getAreaId())
                : "Campus";
            sb.append(String.format("| **%s** | `%s` | %s | %s | #%s |\n",
                a.getSeverity(), a.getAlertType(), a.getMessage(), areaName, a.getRelatedAccessLogId() != null ? a.getRelatedAccessLogId() : "-"));
        }

        return sb.toString();
    }
}
