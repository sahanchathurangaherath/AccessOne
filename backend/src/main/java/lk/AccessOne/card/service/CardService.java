package lk.AccessOne.card.service;

import lk.AccessOne.approval.event.EmployeeExited;
import lk.AccessOne.card.domain.CardCredential;
import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.card.event.CardReportedLost;
import lk.AccessOne.card.event.CardRevoked;
import lk.AccessOne.card.repository.CardCredentialRepository;
import lk.AccessOne.card.repository.IdCardRepository;
import lk.AccessOne.card.web.dto.CardDetail;
import lk.AccessOne.card.web.dto.CardSummary;
import lk.AccessOne.card.web.dto.CardTimelineEntry;
import lk.AccessOne.card.web.dto.CardVerification;
import lk.AccessOne.print.repository.PrintJobRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.audit.AuditValue;
import lk.AccessOne.shared.audit.StatusChangeSupport;
import lk.AccessOne.shared.audit.TimelineService;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.CardStatus;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.storage.FileStorageService;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@Service
public class CardService {

    private final IdCardRepository cards;
    private final CardCredentialRepository credentials;
    private final CardMapper mapper;
    private final EntityLookup lookup;
    private final StatusChangeSupport statusChanges;
    private final TimelineService timelineService;
    private final ApplicationEventPublisher events;
    private final QrCodeService qrCodes;
    private final CardPdfService pdfService;
    private final CredentialPayloadFactory payloads;
    private final FileStorageService storage;
    private final PrintJobRepository printJobs;

    public CardService(IdCardRepository cards, CardCredentialRepository credentials,
                        CardMapper mapper, EntityLookup lookup, StatusChangeSupport statusChanges,
                        TimelineService timelineService, ApplicationEventPublisher events,
                        QrCodeService qrCodes, CardPdfService pdfService,
                        CredentialPayloadFactory payloads, FileStorageService storage,
                        PrintJobRepository printJobs) {
        this.cards = cards;
        this.credentials = credentials;
        this.mapper = mapper;
        this.lookup = lookup;
        this.statusChanges = statusChanges;
        this.timelineService = timelineService;
        this.events = events;
        this.qrCodes = qrCodes;
        this.pdfService = pdfService;
        this.payloads = payloads;
        this.storage = storage;
        this.printJobs = printJobs;
    }

    // ---------- read ----------

    @Transactional(readOnly = true)
    public PageResponse<CardSummary> list(Long employeeId, CardStatus status, Pageable pageable) {
        return PageResponse.of(cards.search(employeeId, status, pageable), mapper::toSummary);
    }

    @Transactional(readOnly = true)
    public CardDetail findById(Long id) {
        IdCard card = lookup.require(cards.findDetailById(id), "Card", id);
        return mapper.toDetail(card, credentials.findByCardId(id).orElse(null));
    }

    @Transactional(readOnly = true)
    public List<CardTimelineEntry> timeline(Long id) {
        findById(id);   // 404s if the card doesn't exist
        return timelineService.forEntity("id_cards", id).stream()
                .map(e -> new CardTimelineEntry(
                        e.status() != null ? e.status() : e.action(),
                        e.changedBy(), e.changedAt(), e.note()))
                .toList();
    }

    @Transactional(readOnly = true)
    public CardPhoto photo(Long id) {
        IdCard card = lookup.require(cards, id, "Card");
        if (card.getPhotoPath() == null) {
            throw new ResourceNotFoundException("Photo", id);
        }
        try {
            byte[] bytes = Files.readAllBytes(storage.resolve(card.getPhotoPath()));
            String contentType = card.getPhotoPath().endsWith(".png") ? "image/png" : "image/jpeg";
            return new CardPhoto(bytes, contentType);
        } catch (IOException e) {
            throw new BusinessRuleException("STORAGE_FAILED", "Could not read the photo.");
        }
    }

    @Transactional(readOnly = true)
    public byte[] qrImage(Long id, int size) {
        CardCredential credential = lookup.require(
                credentials.findByCardId(id), "Credential", id);
        return qrCodes.png(credential.getQrPayload(), size);
    }

    @Transactional(readOnly = true)
    public CardPdf pdf(Long id) {
        IdCard card = lookup.require(cards.findDetailById(id), "Card", id);
        CardCredential credential = lookup.require(credentials.findByCardId(id), "Credential", id);
        return new CardPdf(card.getCardSerial(), pdfService.render(card, credential));
    }

    /**
     * Phase 12's lookup. Returns found=false rather than throwing, because
     * an unrecognised serial is a denied entry attempt to log, not an error.
     */
    @Transactional(readOnly = true)
    public CardVerification verifyBySerial(String serial) {
        return cards.findBySerialWithEmployee(serial)
                .map(mapper::toVerification)
                .orElse(CardVerification.unknown(serial));
    }

    // ---------- lifecycle ----------

    @Transactional
    public CardDetail reportLost(Long id) {
        IdCard card = lookup.require(cards, id, "Card");
        statusChanges.apply("id_cards", id, card::getStatus, card::reportLost);
        events.publishEvent(new CardReportedLost(id, card.getEmployee().getId()));
        return findById(id);
    }

    @Transactional
    public CardDetail reportDamaged(Long id) {
        IdCard card = lookup.require(cards, id, "Card");
        statusChanges.apply("id_cards", id, card::getStatus, card::reportDamaged);
        return findById(id);
    }

    @Transactional
    public CardDetail suspend(Long id) {
        IdCard card = lookup.require(cards, id, "Card");
        statusChanges.apply("id_cards", id, card::getStatus, card::suspend);
        return findById(id);
    }

    @Transactional
    public CardDetail reinstate(Long id) {
        IdCard card = lookup.require(cards, id, "Card");
        statusChanges.apply("id_cards", id, card::getStatus, card::reinstate);
        return findById(id);
    }

    @Transactional
    public CardDetail revoke(Long id, String reason) {
        IdCard card = lookup.require(cards, id, "Card");
        statusChanges.apply("id_cards", id, AuditAction.REVOKE, card::getStatus, () -> card.revoke(reason));
        events.publishEvent(new CardRevoked(id, card.getEmployee().getId(), reason));
        return findById(id);
    }

    @Transactional
    public CardDetail voidCard(Long id, String reason) {
        IdCard card = lookup.require(cards, id, "Card");
        if (hasPrintJob(id)) {
            throw new BusinessRuleException("ALREADY_IN_PRODUCTION",
                "This card has entered the print queue and can no longer be voided. "
              + "Revoke it instead.");
        }
        statusChanges.apply("id_cards", id, card::getStatus, () -> card.voidCard(reason));
        return findById(id);
    }

    /** After a data correction -- same card, new payloads. */
    @Transactional
    public CardDetail regenerateCredentials(Long id) {
        IdCard card = lookup.require(cards, id, "Card");
        CardCredential credential = lookup.require(credentials.findByCardId(id), "Credential", id);

        String qr = payloads.qrPayload(card);
        credential.regenerate(qr, payloads.qrHash(qr), payloads.nfcPayload(card), payloads.nfcFormat());

        events.publishEvent(new AuditEvent("card_qr_nfc_data", credential.getId(),
                AuditAction.UPDATE, null, AuditValue.of().with("regenerated", true).json()));
        return findById(id);
    }

    /**
     * Module 2 published this weeks ago with nothing subscribed. This is
     * the listener that completes the contract -- Module 2 does not change.
     */
    @EventListener
    @Transactional
    public void on(EmployeeExited event) {
        cards.findByEmployeeIdAndStatus(event.employeeId(), CardStatus.ACTIVE)
             .forEach(card -> statusChanges.apply("id_cards", card.getId(), AuditAction.REVOKE,
                     card::getStatus, () -> card.revoke("Employment ended: " + event.reason())));
    }

    /** Module 6's own check on the same table, per the integration contract. */
    private boolean hasPrintJob(Long cardId) {
        return printJobs.existsByCardId(cardId);
    }
}
