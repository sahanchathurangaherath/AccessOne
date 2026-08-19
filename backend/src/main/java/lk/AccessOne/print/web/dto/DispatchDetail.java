package lk.AccessOne.print.web.dto;

import java.time.LocalDateTime;

public record DispatchDetail(
        Long id, Long printJobId, String jobNo, Long cardId, String cardSerial,
        Long employeeId, String employeeName, String empId,
        String dispatchMethod, String status, LocalDateTime dispatchedAt,
        String receivedByName, LocalDateTime handedOverAt,
        String handoverSignaturePath, String remarks, LocalDateTime createdAt) { }
