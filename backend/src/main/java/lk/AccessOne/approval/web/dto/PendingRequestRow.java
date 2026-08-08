package lk.AccessOne.approval.web.dto;

import java.time.LocalDateTime;

public record PendingRequestRow(
        Long requestId, String requestNo, String requestType, String status,
        String empId, String employeeName, String designation, String deptName,
        LocalDateTime submittedAt, int hoursPending, String ageingFlag) { }
