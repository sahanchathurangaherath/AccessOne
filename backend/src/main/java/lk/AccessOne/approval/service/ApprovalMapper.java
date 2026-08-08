package lk.AccessOne.approval.service;

import lk.AccessOne.approval.domain.Approval;
import lk.AccessOne.approval.domain.ApprovalComment;
import lk.AccessOne.approval.repository.PendingQueueRepository.QueueRow;
import lk.AccessOne.approval.web.dto.ApprovalDetail;
import lk.AccessOne.approval.web.dto.ApprovalHistoryRow;
import lk.AccessOne.approval.web.dto.CommentDto;
import lk.AccessOne.approval.web.dto.PendingRequestRow;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.cardrequest.domain.RequestDocument;
import lk.AccessOne.cardrequest.web.dto.DocumentSummary;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.Decision;
import org.springframework.stereotype.Component;

/** Manual mapping only -- same reasoning as CardRequestMapper: not worth a library at this size. */
@Component
public class ApprovalMapper {

    public PendingRequestRow toQueueRow(QueueRow row) {
        return new PendingRequestRow(
                row.getRequestId(), row.getRequestNo(), row.getRequestType(), row.getStatus(),
                row.getEmpId(), row.getEmployeeName(), row.getDesignation(), row.getDeptName(),
                row.getSubmittedAt(), row.getHoursPending() == null ? 0 : row.getHoursPending(),
                row.getAgeingFlag());
    }

    public ApprovalDetail toDetail(Approval a) {
        CardRequest request = a.getRequest();
        Employee employee = request.getEmployee();
        Decision decision = a.getDecision();

        return new ApprovalDetail(
                a.getId(), request.getId(), request.getRequestNo(),
                decision.name(), a.getRejectionReason(),
                employee.getFullName(), employee.getEmpId(), employee.getDesignation(),
                employee.getDepartment().getDeptName(),
                employee.isActivelyEmployed(),
                userName(a.getVerifiedBy()), a.getVerifiedAt(),
                userName(a.getDecidedBy()), a.getDecidedAt(),
                decision.canTransitionTo(Decision.VERIFIED),
                decision.canTransitionTo(Decision.APPROVED),
                a.getComments().stream().map(this::toComment).toList(),
                request.getDocuments().stream().map(this::toDocument).toList());
    }

    public ApprovalHistoryRow toHistoryRow(Approval a) {
        CardRequest request = a.getRequest();
        Employee employee = request.getEmployee();
        return new ApprovalHistoryRow(
                request.getId(), request.getRequestNo(),
                employee.getFullName(), employee.getEmpId(),
                a.getDecision().name(), userName(a.getDecidedBy()), a.getDecidedAt());
    }

    private CommentDto toComment(ApprovalComment c) {
        return new CommentDto(c.getId(), c.getCommentText(), userName(c.getCommentedBy()), c.getCommentedAt());
    }

    private DocumentSummary toDocument(RequestDocument d) {
        return new DocumentSummary(
                d.getId(), d.getDocumentType().name(), d.getFileName(),
                d.getMimeType(), d.getFileSizeBytes(), d.getUploadedAt());
    }

    private String userName(User user) {
        return user == null ? null : user.getUsername();
    }
}
