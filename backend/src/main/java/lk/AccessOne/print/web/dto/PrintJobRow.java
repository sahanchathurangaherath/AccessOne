package lk.AccessOne.print.web.dto;

import java.time.LocalDateTime;

public record PrintJobRow(
        Long id, String jobNo, String cardSerial,
        String employeeName, String empId, String departmentName,
        String jobType, String status, String printerName,
        LocalDateTime queuedAt, LocalDateTime printedAt) { }
