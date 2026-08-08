package lk.AccessOne.approval.web;

import jakarta.validation.Valid;
import lk.AccessOne.approval.service.ApprovalService;
import lk.AccessOne.approval.web.dto.ApprovalDetail;
import lk.AccessOne.approval.web.dto.ApprovalHistoryRow;
import lk.AccessOne.approval.web.dto.ApprovalTimelineEntry;
import lk.AccessOne.approval.web.dto.BulkApproveRequest;
import lk.AccessOne.approval.web.dto.BulkResult;
import lk.AccessOne.approval.web.dto.CommentRequest;
import lk.AccessOne.approval.web.dto.DecisionRequest;
import lk.AccessOne.approval.web.dto.EmployeeExitRequest;
import lk.AccessOne.approval.web.dto.PendingRequestRow;
import lk.AccessOne.approval.web.dto.RaiseBatchRequest;
import lk.AccessOne.cardrequest.web.dto.CardRequestDetail;
import lk.AccessOne.cardrequest.web.dto.CreateCardRequest;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Thin. DTOs in, DTOs out, no business logic -- every rule lives in the service. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/approvals")
public class ApprovalController {

    private final ApprovalService service;

    public ApprovalController(ApprovalService service) {
        this.service = service;
    }

    @GetMapping("/queue")
    public PageResponse<PendingRequestRow> queue(
            @RequestParam(required = false) String ageing,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return service.queue(ageing, page, size);
    }

    @GetMapping("/{requestId}")
    public ApprovalDetail get(@PathVariable Long requestId) {
        return service.findByRequestId(requestId);
    }

    @GetMapping("/{requestId}/timeline")
    public List<ApprovalTimelineEntry> timeline(@PathVariable Long requestId) {
        return service.timeline(requestId);
    }

    @PostMapping("/{requestId}/verify")
    public ApprovalDetail verify(@PathVariable Long requestId) {
        return service.verify(requestId);
    }

    @PostMapping("/{requestId}/approve")
    public ApprovalDetail approve(@PathVariable Long requestId) {
        return service.approve(requestId);
    }

    @PostMapping("/{requestId}/reject")
    public ApprovalDetail reject(@PathVariable Long requestId,
                                 @RequestBody @Valid DecisionRequest body) {
        return service.reject(requestId, body.reason());
    }

    @PostMapping("/{requestId}/comments")
    public ApprovalDetail comment(@PathVariable Long requestId,
                                  @RequestBody @Valid CommentRequest body) {
        return service.comment(requestId, body.text());
    }

    @PostMapping("/bulk-approve")
    public BulkResult bulkApprove(@RequestBody @Valid BulkApproveRequest body) {
        return service.bulkApprove(body.requestIds());
    }

    @GetMapping("/history")
    public PageResponse<ApprovalHistoryRow> history(
            @RequestParam(required = false) Long deciderId,
            @PageableDefault(size = 20, sort = "decidedAt", direction = Sort.Direction.DESC) Pageable pageable) {
        return service.history(deciderId, pageable);
    }

    @PostMapping("/raise")
    @ResponseStatus(HttpStatus.CREATED)
    public CardRequestDetail raiseOnBehalf(@RequestBody @Valid CreateCardRequest body) {
        return service.raiseOnBehalf(body);
    }

    @PostMapping("/raise-batch")
    public BulkResult raiseBatch(@RequestBody @Valid RaiseBatchRequest body) {
        return service.raiseBatch(body.requests());
    }

    @PostMapping("/employees/{employeeId}/exit")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void recordExit(@PathVariable Long employeeId, @RequestBody @Valid EmployeeExitRequest body) {
        service.recordExit(employeeId, body.reason(), body.exitDate());
    }
}
