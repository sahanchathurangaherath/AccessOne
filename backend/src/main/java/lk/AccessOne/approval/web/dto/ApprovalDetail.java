package lk.AccessOne.approval.web.dto;

import lk.AccessOne.cardrequest.web.dto.DocumentSummary;

import java.time.LocalDateTime;
import java.util.List;

public record ApprovalDetail(
        Long approvalId, Long requestId, String requestNo,
        String decision, String rejectionReason,
        String employeeName, String empId, String designation, String deptName,
        boolean employeeStillActive,
        String verifiedBy, LocalDateTime verifiedAt,
        String decidedBy, LocalDateTime decidedAt,
        boolean canVerify, boolean canDecide,
        List<CommentDto> comments, List<DocumentSummary> documents) { }
