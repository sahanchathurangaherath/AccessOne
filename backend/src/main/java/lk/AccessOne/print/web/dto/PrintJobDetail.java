package lk.AccessOne.print.web.dto;

import java.time.LocalDateTime;

public record PrintJobDetail(
        Long id, String jobNo, Long cardId, String cardSerial,
        String employeeName, String empId, String departmentName,
        String jobType, String status, String printerName,
        LocalDateTime queuedAt, LocalDateTime printedAt,
        String qcResult, String qcNotes, String cancelledReason,
        boolean dispatchable, LocalDateTime createdAt) { }
