package lk.AccessOne.approval.service;

import lk.AccessOne.approval.domain.Approval;
import lk.AccessOne.approval.repository.ApprovalRepository;
import lk.AccessOne.cardrequest.event.CardRequestSubmitted;
import lk.AccessOne.cardrequest.repository.CardRequestRepository;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class RequestSubmittedListener {

    private final ApprovalRepository approvals;
    private final CardRequestRepository requests;

    public RequestSubmittedListener(ApprovalRepository approvals, CardRequestRepository requests) {
        this.approvals = approvals;
        this.requests = requests;
    }

    /**
     * Runs inside the submitting transaction, so a request and its
     * approval row are created together or not at all.
     *
     * A resubmitted request already has an approval row -- reopen it
     * rather than inserting a second one, which uq_approvals_request
     * would reject anyway.
     */
    @EventListener
    @Transactional
    public void on(CardRequestSubmitted event) {
        approvals.findByRequestId(event.requestId())
                 .ifPresentOrElse(
                     Approval::reopen,
                     () -> approvals.save(Approval.openFor(
                             requests.getReferenceById(event.requestId()))));
    }
}
