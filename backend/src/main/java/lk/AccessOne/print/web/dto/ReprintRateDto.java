package lk.AccessOne.print.web.dto;

import java.math.BigDecimal;

public record ReprintRateDto(
        String deptName, int totalJobs, int initialJobs, int reprintJobs,
        BigDecimal reprintRatePct, int qcFailures) { }
