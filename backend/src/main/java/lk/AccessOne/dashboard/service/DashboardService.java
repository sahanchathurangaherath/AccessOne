package lk.AccessOne.dashboard.service;

import lk.AccessOne.access.repository.AccessLevelRepository;
import lk.AccessOne.approval.repository.ApprovalRepository;
import lk.AccessOne.approval.repository.PendingQueueRepository;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.repository.IdCardRepository;
import lk.AccessOne.cardrequest.repository.CardRequestRepository;
import lk.AccessOne.dashboard.repository.CardStatusSummaryRepository;
import lk.AccessOne.dashboard.repository.CardStatusSummaryRepository.DeptCardStatusRow;
import lk.AccessOne.dashboard.web.dto.AdminDashboard;
import lk.AccessOne.dashboard.web.dto.AdminDashboard.AuditActivityRow;
import lk.AccessOne.dashboard.web.dto.EmployeeDashboard;
import lk.AccessOne.dashboard.web.dto.HrDashboard;
import lk.AccessOne.dashboard.web.dto.ItDashboard;
import lk.AccessOne.dashboard.web.dto.ItDashboard.DeptCardStatus;
import lk.AccessOne.dashboard.web.dto.PrintDashboard;
import lk.AccessOne.dashboard.web.dto.SecurityDashboard;
import lk.AccessOne.entry.repository.AccessLogRepository;
import lk.AccessOne.entry.repository.SecurityAlertRepository;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.print.repository.PrintJobRepository;
import lk.AccessOne.print.repository.ProductionReportRepository;
import lk.AccessOne.print.repository.ProductionReportRepository.ReprintRateRow;
import lk.AccessOne.shared.audit.AuditLogRepository;
import lk.AccessOne.shared.enums.AlertStatus;
import lk.AccessOne.shared.enums.Decision;
import lk.AccessOne.shared.enums.PrintStatus;
import lk.AccessOne.shared.enums.RequestStatus;
import lk.AccessOne.shared.security.OwnershipGuard;
import lk.AccessOne.visitor.repository.OnSiteRepository;
import lk.AccessOne.visitor.repository.VisitorPassRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;

/**
 * One method per role, one query set each, no client-side aggregation --
 * every number here is a repository call, and every tile that counts
 * something can be reconciled against the same query run directly in SSMS.
 */
@Service
public class DashboardService {

    private static final Set<RequestStatus> IN_PROGRESS =
            Set.of(RequestStatus.SUBMITTED, RequestStatus.UNDER_VERIFICATION);
    private static final Set<Decision> DECIDED = Set.of(Decision.APPROVED, Decision.REJECTED);

    private final OwnershipGuard guard;
    private final IdCardRepository cards;
    private final CardRequestRepository requests;
    private final PendingQueueRepository queue;
    private final ApprovalRepository approvals;
    private final AccessLevelRepository accessLevels;
    private final CardStatusSummaryRepository cardStatusSummary;
    private final OnSiteRepository onSite;
    private final SecurityAlertRepository alerts;
    private final AccessLogRepository accessLogs;
    private final VisitorPassRepository passes;
    private final PrintJobRepository printJobs;
    private final ProductionReportRepository productionReports;
    private final UserRepository users;
    private final AuditLogRepository auditLogs;

    public DashboardService(OwnershipGuard guard, IdCardRepository cards, CardRequestRepository requests,
                             PendingQueueRepository queue, ApprovalRepository approvals,
                             AccessLevelRepository accessLevels, CardStatusSummaryRepository cardStatusSummary,
                             OnSiteRepository onSite, SecurityAlertRepository alerts,
                             AccessLogRepository accessLogs, VisitorPassRepository passes,
                             PrintJobRepository printJobs, ProductionReportRepository productionReports,
                             UserRepository users, AuditLogRepository auditLogs) {
        this.guard = guard;
        this.cards = cards;
        this.requests = requests;
        this.queue = queue;
        this.approvals = approvals;
        this.accessLevels = accessLevels;
        this.cardStatusSummary = cardStatusSummary;
        this.onSite = onSite;
        this.alerts = alerts;
        this.accessLogs = accessLogs;
        this.passes = passes;
        this.printJobs = printJobs;
        this.productionReports = productionReports;
        this.users = users;
        this.auditLogs = auditLogs;
    }

    @Transactional(readOnly = true)
    public EmployeeDashboard employee() {
        Long employeeId = guard.currentEmployeeId();
        String status = employeeId == null ? null
                : cards.findFirstByEmployeeIdOrderByIssueDateDesc(employeeId)
                       .map(IdCard::getStatus).map(Enum::name).orElse(null);
        long inProgress = employeeId == null ? 0
                : requests.countByEmployeeIdAndStatusIn(employeeId, IN_PROGRESS);
        return new EmployeeDashboard(status, inProgress);
    }

    @Transactional(readOnly = true)
    public HrDashboard hr() {
        BigDecimal avgHours = approvals.averageTurnaroundHours(startOfMonth());
        return new HrDashboard(
                queue.countQueue(null),
                queue.countQueue("OVERDUE"),
                approvals.countByDecisionInAndDecidedAtGreaterThanEqual(DECIDED, startOfWeek()),
                avgHours == null ? BigDecimal.ZERO : avgHours);
    }

    @Transactional(readOnly = true)
    public ItDashboard it() {
        List<DeptCardStatusRow> byDept = cardStatusSummary.findAll();
        long active = byDept.stream().mapToLong(DeptCardStatusRow::getActiveCards).sum();
        long revoked = byDept.stream().mapToLong(DeptCardStatusRow::getRevokedCards).sum();

        return new ItDashboard(
                active, revoked,
                requests.countAwaitingCardGeneration(),
                accessLevels.countByActiveTrue(),
                byDept.stream()
                      .map(r -> new DeptCardStatus(r.getDeptCode(), r.getDeptName(),
                              r.getTotalCards(), r.getActiveCards(), r.getRevokedCards()))
                      .toList());
    }

    @Transactional(readOnly = true)
    public SecurityDashboard security() {
        LocalDateTime now = LocalDateTime.now(ZoneOffset.UTC);
        return new SecurityDashboard(
                onSite.findOnSite().size(),
                alerts.countByStatus(AlertStatus.OPEN),
                accessLogs.countDeniedToday(),
                passes.findExpiringBetween(now, now.plusHours(1)).size());
    }

    @Transactional(readOnly = true)
    public PrintDashboard print() {
        List<ReprintRateRow> byDept = productionReports.reprintRateByDepartment(null);
        long totalJobs = byDept.stream().mapToLong(ReprintRateRow::getTotalJobs).sum();
        long reprintJobs = byDept.stream().mapToLong(ReprintRateRow::getReprintJobs).sum();
        BigDecimal reprintRate = totalJobs == 0 ? BigDecimal.ZERO
                : BigDecimal.valueOf(reprintJobs * 100.0 / totalJobs).setScale(1, RoundingMode.HALF_UP);

        return new PrintDashboard(
                printJobs.countByStatus(PrintStatus.QUEUED),
                printJobs.countByStatus(PrintStatus.IN_PROGRESS),
                printJobs.countPrintedToday(),
                reprintRate);
    }

    @Transactional(readOnly = true)
    public AdminDashboard admin() {
        List<AuditActivityRow> recent = auditLogs
                .search(null, null, null, null, null, null, PageRequest.of(0, 8))
                .stream()
                .map(a -> new AuditActivityRow(a.getEntityName(), a.getEntityId(),
                        a.getAction().name(), a.getPerformedByUsername(), a.getPerformedAt()))
                .toList();

        return new AdminDashboard(
                users.count(),
                auditLogs.countByPerformedAtGreaterThanEqual(startOfDay()),
                users.countByFailedLoginAttemptsGreaterThan((short) 0),
                recent);
    }

    private LocalDateTime startOfDay() {
        return LocalDate.now(ZoneOffset.UTC).atStartOfDay();
    }

    private LocalDateTime startOfWeek() {
        return LocalDate.now(ZoneOffset.UTC).with(DayOfWeek.MONDAY).atStartOfDay();
    }

    private LocalDateTime startOfMonth() {
        return LocalDate.now(ZoneOffset.UTC).withDayOfMonth(1).atStartOfDay();
    }
}
