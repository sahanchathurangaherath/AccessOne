package lk.AccessOne.print.web.dto;

import java.time.LocalDateTime;

public record DispatchRow(
        Long id, Long printJobId, String jobNo, String cardSerial,
        String employeeName, String dispatchMethod, String status,
        LocalDateTime dispatchedAt, LocalDateTime handedOverAt) { }
