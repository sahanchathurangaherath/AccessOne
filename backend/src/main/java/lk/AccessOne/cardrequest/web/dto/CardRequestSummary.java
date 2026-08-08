package lk.AccessOne.cardrequest.web.dto;

import java.time.LocalDateTime;

public record CardRequestSummary(
        Long id, String requestNo, String requestType, String status,
        String employeeName, String empId, String departmentName,
        LocalDateTime submittedAt, LocalDateTime createdAt) { }
