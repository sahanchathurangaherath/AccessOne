package lk.AccessOne.cardrequest.service;

import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.cardrequest.domain.RequestDocument;
import lk.AccessOne.cardrequest.web.dto.CardRequestDetail;
import lk.AccessOne.cardrequest.web.dto.CardRequestSummary;
import lk.AccessOne.cardrequest.web.dto.DocumentSummary;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.RequestStatus;
import org.springframework.stereotype.Component;

/** Manual mapping only -- at this size a mapping library buys nothing but a dependency to justify. */
@Component
public class CardRequestMapper {

    public CardRequestSummary toSummary(CardRequest r) {
        Employee e = r.getEmployee();
        return new CardRequestSummary(
                r.getId(), r.getRequestNo(),
                r.getRequestType().name(), r.getStatus().name(),
                e.getFullName(), e.getEmpId(), e.getDepartment().getDeptName(),
                r.getSubmittedAt(), r.getCreatedAt());
    }

    public CardRequestDetail toDetail(CardRequest r) {
        Employee e = r.getEmployee();
        return new CardRequestDetail(
                r.getId(), r.getRequestNo(),
                r.getRequestType().name(), r.getStatus().name(),
                r.getReason(), r.getPreviousCardId(),
                e.getFullName(), e.getEmpId(), e.getDesignation(),
                e.getDepartment().getDeptName(),
                r.getRequestedAccessLevel() == null ? null
                        : r.getRequestedAccessLevel().getLevelName(),
                r.getPhotoPath() != null,
                r.getSubmittedAt(), r.getClosedAt(), r.getCreatedAt(),
                r.getStatus() == RequestStatus.DRAFT,
                r.getStatus().canTransitionTo(RequestStatus.WITHDRAWN),
                r.isHardDeletable(),
                r.getDocuments().stream().map(this::toDocument).toList());
    }

    public DocumentSummary toDocument(RequestDocument d) {
        return new DocumentSummary(
                d.getId(), d.getDocumentType().name(), d.getFileName(),
                d.getMimeType(), d.getFileSizeBytes(), d.getUploadedAt());
    }
}
