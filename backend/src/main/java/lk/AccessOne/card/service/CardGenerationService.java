package lk.AccessOne.card.service;

import lk.AccessOne.access.domain.AccessLevel;
import lk.AccessOne.access.service.AccessLevelService;
import lk.AccessOne.card.domain.CardCredential;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.event.CardGenerated;
import lk.AccessOne.card.repository.CardCredentialRepository;
import lk.AccessOne.card.repository.IdCardRepository;
import lk.AccessOne.card.web.dto.CardDetail;
import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.cardrequest.repository.CardRequestRepository;
import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.StatusChangeSupport;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.service.EntityLookup;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CardGenerationService {

    private final CardRequestRepository requests;
    private final IdCardRepository cards;
    private final CardCredentialRepository credentials;
    private final CardSerialGenerator serials;
    private final CredentialPayloadFactory payloads;
    private final AccessLevelService accessLevelService;
    private final EntityLookup lookup;
    private final StatusChangeSupport statusChanges;
    private final ApplicationEventPublisher events;
    private final CardMapper mapper;

    public CardGenerationService(CardRequestRepository requests, IdCardRepository cards,
                                  CardCredentialRepository credentials, CardSerialGenerator serials,
                                  CredentialPayloadFactory payloads, AccessLevelService accessLevelService,
                                  EntityLookup lookup, StatusChangeSupport statusChanges,
                                  ApplicationEventPublisher events, CardMapper mapper) {
        this.requests = requests;
        this.cards = cards;
        this.credentials = credentials;
        this.serials = serials;
        this.payloads = payloads;
        this.accessLevelService = accessLevelService;
        this.lookup = lookup;
        this.statusChanges = statusChanges;
        this.events = events;
        this.mapper = mapper;
    }

    @Transactional
    public CardDetail generateFor(Long requestId) {
        CardRequest request = lookup.require(requests.findDetailById(requestId), "Card request", requestId);

        cards.findByRequestId(requestId).ifPresent(existing -> {
            throw new BusinessRuleException("ALREADY_GENERATED",
                "A card already exists for this request: " + existing.getCardSerial());
        });

        Employee employee = request.getEmployee();
        AccessLevel level = request.getRequestedAccessLevel();

        short version = (short) (cards.findLatestVersionFor(employee.getId()) + 1);

        IdCard card = IdCard.generate(
                serials.next(), request, employee, level, version, request.getPhotoPath());
        cards.save(card);

        // Credentials, in the same transaction. A card without a QR is not
        // a credential, so the two are never separately committed.
        String qr = payloads.qrPayload(card);
        credentials.save(new CardCredential(
                card, qr, payloads.qrHash(qr),
                payloads.nfcPayload(card), payloads.nfcFormat(),
                CredentialPayloadFactory.ALGORITHM));

        // Module 3 records the assignment history. id_cards.access_level_id
        // is the current level for fast reads; card_access_assignments is
        // the history of who granted it and when. Both are intentional.
        if (level != null) {
            accessLevelService.assign(card.getId(), level.getId(), "Assigned on card generation");
        }

        linkReplacementIfAny(request, card);

        events.publishEvent(AuditEvent.created("id_cards", card.getId(),
                "{\"card_serial\":\"%s\",\"version\":%d}".formatted(card.getCardSerial(), version)));
        events.publishEvent(new CardGenerated(card.getId(), employee.getId(), card.getCardSerial()));

        return mapper.toDetail(card, credentials.findByCardId(card.getId()).orElse(null));
    }

    /**
     * A REPLACEMENT request carries previous_card_id. Retire the old card in
     * the same transaction that creates the new one -- any gap where both
     * are usable is a real security hole, not a tidiness problem.
     */
    private void linkReplacementIfAny(CardRequest request, IdCard newCard) {
        if (request.getPreviousCardId() == null) return;

        IdCard previous = lookup.require(cards, request.getPreviousCardId(), "Previous card");
        statusChanges.apply("id_cards", previous.getId(), previous::getStatus,
                () -> previous.supersededBy(newCard));
    }
}
