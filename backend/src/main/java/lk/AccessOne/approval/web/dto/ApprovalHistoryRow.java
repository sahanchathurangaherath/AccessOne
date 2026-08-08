package lk.AccessOne.approval.web.dto;

import java.time.LocalDateTime;

public record ApprovalHistoryRow(
        Long requestId, String requestNo, String employeeName, String empId,
        String decision, String decidedBy, LocalDateTime decidedAt) { }
