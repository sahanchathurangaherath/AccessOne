package lk.AccessOne.dashboard.web.dto;

import java.math.BigDecimal;

public record HrDashboard(
        long pending, long overdue, long decidedThisWeek, BigDecimal avgTurnaroundHours) { }
