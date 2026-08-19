package lk.AccessOne.visitor.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record DailyReportDto(
        LocalDate visitDate, int totalVisits, int stillOnSite,
        int distinctVisitors, int contractorVisits, BigDecimal avgMinutesOnSite) { }
