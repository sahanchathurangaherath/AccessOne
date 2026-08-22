package lk.AccessOne.entry.decision;

import lk.AccessOne.access.domain.Area;
import lk.AccessOne.access.repository.AreaRepository;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.repository.IdCardRepository;
import lk.AccessOne.entry.repository.BlacklistRepository;
import lk.AccessOne.shared.enums.CredentialType;
import lk.AccessOne.shared.enums.DenialReason;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

@Component
public class EmployeeCardStrategy implements AccessDecisionStrategy {

    private final IdCardRepository cards;
    private final AreaRepository areas;
    private final BlacklistRepository blacklist;

    public EmployeeCardStrategy(IdCardRepository cards, AreaRepository areas, BlacklistRepository blacklist) {
        this.cards = cards;
        this.areas = areas;
        this.blacklist = blacklist;
    }

    @Override
    public boolean supports(CredentialType type) {
        return type == CredentialType.EMPLOYEE_CARD;
    }

    /**
     * Checks run cheapest-first, and each returns immediately with a
     * specific reason. The order also matters for the alert rules: a
     * blacklisted card should raise BLACKLIST_ATTEMPT rather than being
     * refused earlier for some lesser reason.
     */
    @Override
    @Transactional(readOnly = true)
    public AccessDecisionResult evaluate(AccessRequest request) {

        Optional<Area> maybeArea = areas.findByAreaCode(request.areaCode());

        // The card is loaded with employee, department, access level and
        // its permitted areas in one query -- permits() walks the area
        // set, and a lazy load here would throw at the door.
        Optional<IdCard> maybeCard = cards.findBySerialWithEmployee(request.credentialRef());

        if (maybeCard.isEmpty()) {
            return AccessDecisionResult.unknownCredential(
                    CredentialType.EMPLOYEE_CARD,
                    request.credentialRef(),
                    maybeArea.map(Area::getId).orElse(null),
                    maybeArea.map(Area::getAreaName).orElse("Unknown area"));
        }

        IdCard card = maybeCard.get();
        String holder = card.getPrintedName();

        if (maybeArea.isEmpty()) {
            return AccessDecisionResult.denied(DenialReason.UNKNOWN_AREA,
                    CredentialType.EMPLOYEE_CARD, card.getId(), null, null,
                    card.getCardSerial(), holder, request.areaCode());
        }
        Area area = maybeArea.get();

        // Blacklist first among the card checks: it is the most serious
        // and should be the reason recorded even if other checks also fail.
        if (blacklist.isCardBlacklisted(card.getId())) {
            return deny(DenialReason.CARD_BLACKLISTED, card, area);
        }

        if (!card.isUsable()) {
            return deny(DenialReason.CARD_NOT_ACTIVE, card, area);
        }

        if (!card.getEmployee().isActivelyEmployed()) {
            return deny(DenialReason.EMPLOYEE_NOT_ACTIVE, card, area);
        }

        if (card.getAccessLevel() == null) {
            return deny(DenialReason.NO_ACCESS_LEVEL, card, area);
        }

        if (!area.isReachable()) {
            return deny(DenialReason.AREA_INACTIVE, card, area);
        }

        // Module 3's method. One definition of what a level permits, used
        // by the configuration screen, the rule test and the door.
        if (!card.getAccessLevel().permits(area)) {
            return deny(DenialReason.AREA_NOT_PERMITTED, card, area);
        }

        return AccessDecisionResult.granted(CredentialType.EMPLOYEE_CARD,
                card.getId(), null, area.getId(),
                card.getCardSerial(), holder, area.getAreaName());
    }

    private AccessDecisionResult deny(DenialReason reason, IdCard card, Area area) {
        return AccessDecisionResult.denied(reason, CredentialType.EMPLOYEE_CARD,
                card.getId(), null, area.getId(),
                card.getCardSerial(), card.getPrintedName(), area.getAreaName());
    }
}
