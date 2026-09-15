package lk.AccessOne.dashboard.web.dto;

import java.math.BigDecimal;

public record PrintDashboard(
        long queued, long inProgress, long printedToday, BigDecimal reprintRatePct) { }
