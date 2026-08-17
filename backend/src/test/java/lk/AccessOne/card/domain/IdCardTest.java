package lk.AccessOne.card.domain;

import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.organisation.domain.Department;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.CardStatus;
import lk.AccessOne.shared.enums.RequestType;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.InvalidStateTransitionException;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Pure domain tests -- no Spring context, no database. IdCard.moveTo() is
 * the one place status changes, so the constraints it is meant to uphold
 * (chk_id_cards_activation, chk_id_cards_revocation, chk_id_cards_not_self)
 * are worth pinning down here rather than trusting them by inspection.
 */
class IdCardTest {

    private Employee employee() {
        Department dept = new Department("FIN", "Finance", null);
        return new Employee("EMP001", "Nimal", "Perera", "982345678V",
                "nimal@accessone.lk", null, "Software Engineer", dept, LocalDate.now());
    }

    private CardRequest request(Employee employee) {
        return CardRequest.draft("REQ-2026-9001", employee, RequestType.NEW,
                null, null, null, null);
    }

    private IdCard freshCard() {
        Employee employee = employee();
        return IdCard.generate("ACO-2026-000010", request(employee), employee,
                null, (short) 1, null);
    }

    @Test
    void generateSnapshotsThePrintedDetailsFromTheEmployee() {
        IdCard card = freshCard();

        assertThat(card.getStatus()).isEqualTo(CardStatus.GENERATED);
        assertThat(card.getPrintedName()).isEqualTo("Nimal Perera");
        assertThat(card.getPrintedDesignation()).isEqualTo("Software Engineer");
        assertThat(card.getPrintedDepartment()).isEqualTo("Finance");
    }

    @Test
    void activateSetsBothStatusAndTimestampTogether() {
        IdCard card = freshCard();
        card.moveTo(CardStatus.QUEUED_FOR_PRINT);
        card.moveTo(CardStatus.PRINTED);
        card.moveTo(CardStatus.DISPATCHED);

        card.activate();

        // chk_id_cards_activation (status <> 'ACTIVE' OR activated_at IS NOT
        // NULL) would reject the row if only one of these were set.
        assertThat(card.getStatus()).isEqualTo(CardStatus.ACTIVE);
        assertThat(card.getActivatedAt()).isNotNull();
    }

    @Test
    void revokingWithoutAReasonIsRefused() {
        IdCard card = activeCard();

        assertThatThrownBy(() -> card.revoke("  "))
                .isInstanceOf(BusinessRuleException.class);

        // A rejected revoke must leave the card unchanged, not half-transitioned.
        assertThat(card.getStatus()).isEqualTo(CardStatus.ACTIVE);
        assertThat(card.getRevokedAt()).isNull();
    }

    @Test
    void revokeSetsStatusTimestampAndReasonTogether() {
        IdCard card = activeCard();

        card.revoke("Employment terminated");

        // chk_id_cards_revocation (status <> 'REVOKED' OR (revoked_at IS NOT
        // NULL AND revocation_reason IS NOT NULL)) needs both, not either.
        assertThat(card.getStatus()).isEqualTo(CardStatus.REVOKED);
        assertThat(card.getRevokedAt()).isNotNull();
        assertThat(card.getRevocationReason()).isEqualTo("Employment terminated");
    }

    @Test
    void aCardCannotReplaceItself() {
        IdCard card = activeCard();

        assertThatThrownBy(() -> card.supersededBy(card))
                .isInstanceOf(BusinessRuleException.class);
        assertThat(card.getStatus()).isEqualTo(CardStatus.ACTIVE);
    }

    @Test
    void supersededBySetsStatusAndTheReplacementLinkTogether() {
        IdCard oldCard = activeCard();
        IdCard newCard = freshCard();

        oldCard.supersededBy(newCard);

        assertThat(oldCard.getStatus()).isEqualTo(CardStatus.REPLACED);
        assertThat(oldCard.getReplacedBy()).isSameAs(newCard);
        // The replacement itself is unaffected -- linking is one-directional.
        assertThat(newCard.getStatus()).isEqualTo(CardStatus.GENERATED);
    }

    @Test
    void aFreshlyGeneratedCardCannotJumpStraightToActive() {
        IdCard card = freshCard();

        assertThatThrownBy(() -> card.moveTo(CardStatus.ACTIVE))
                .isInstanceOf(InvalidStateTransitionException.class);
        assertThat(card.getStatus()).isEqualTo(CardStatus.GENERATED);
    }

    @Test
    void onlyAnActiveCardIsUsable() {
        IdCard card = freshCard();
        assertThat(card.isUsable()).isFalse();

        card.moveTo(CardStatus.QUEUED_FOR_PRINT);
        card.moveTo(CardStatus.PRINTED);
        card.moveTo(CardStatus.DISPATCHED);
        assertThat(card.isUsable()).isFalse();

        card.activate();
        assertThat(card.isUsable()).isTrue();

        card.suspend();
        assertThat(card.isUsable()).isFalse();
    }

    private IdCard activeCard() {
        IdCard card = freshCard();
        card.moveTo(CardStatus.QUEUED_FOR_PRINT);
        card.moveTo(CardStatus.PRINTED);
        card.moveTo(CardStatus.DISPATCHED);
        card.activate();
        return card;
    }
}
