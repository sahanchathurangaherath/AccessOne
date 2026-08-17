package lk.AccessOne.card.service;

import lk.AccessOne.card.domain.CardCredential;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.web.dto.CardDetail;
import lk.AccessOne.card.web.dto.CardSummary;
import lk.AccessOne.card.web.dto.CardVerification;
import lk.AccessOne.organisation.domain.Employee;
import org.springframework.stereotype.Component;

/** Manual mapping only -- same reasoning as CardRequestMapper: not worth a library at this size. */
@Component
public class CardMapper {

    public CardSummary toSummary(IdCard c) {
        Employee e = c.getEmployee();
        return new CardSummary(
                c.getId(), c.getCardSerial(), c.getStatus().name(),
                e.getFullName(), e.getEmpId(), e.getDepartment().getDeptName(),
                c.getIssueDate(), c.getCreatedAt());
    }

    public CardDetail toDetail(IdCard c, CardCredential credential) {
        return new CardDetail(
                c.getId(), c.getCardSerial(), c.getStatus().name(), c.getVersionNo(), c.isUsable(),
                c.getEmployee().getEmpId(), c.getPrintedName(), c.getPrintedDesignation(),
                c.getPrintedDepartment(),
                c.getAccessLevel() == null ? null : c.getAccessLevel().getLevelName(),
                c.getIssueDate(), c.getActivatedAt(),
                c.getRevokedAt(), c.getRevocationReason(),
                c.getReplacedBy() == null ? null : c.getReplacedBy().getId(),
                c.getReplacedBy() == null ? null : c.getReplacedBy().getCardSerial(),
                credential == null ? null : credential.getNfcFormat(),
                credential == null ? null : credential.getEncodingAlgorithm(),
                credential == null ? null : credential.getNfcPayload(),
                credential == null ? null : credential.getGeneratedAt(),
                c.getCreatedAt());
    }

    public CardVerification toVerification(IdCard c) {
        return new CardVerification(
                true, c.getId(), c.getCardSerial(), c.getStatus().name(), c.isUsable(),
                c.getPrintedName(), c.getEmployee().getEmpId(), c.getPrintedDepartment(),
                c.getAccessLevel() == null ? null : c.getAccessLevel().getLevelName());
    }
}
