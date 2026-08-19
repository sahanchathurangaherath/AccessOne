package lk.AccessOne.print.web.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

public record ThroughputDto(
        LocalDate printDate, int cardsPrinted, int passed, int failed,
        BigDecimal avgHoursInQueue) { }
