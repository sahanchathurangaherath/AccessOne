package lk.AccessOne.card.web;

import jakarta.validation.Valid;
import lk.AccessOne.card.service.CardPdf;
import lk.AccessOne.card.service.CardPhoto;
import lk.AccessOne.card.service.CardService;
import lk.AccessOne.card.web.dto.CardDetail;
import lk.AccessOne.card.web.dto.CardSummary;
import lk.AccessOne.card.web.dto.CardTimelineEntry;
import lk.AccessOne.card.web.dto.CardVerification;
import lk.AccessOne.card.web.dto.ReasonRequest;
import lk.AccessOne.shared.enums.CardStatus;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/** Thin. DTOs in, DTOs out, no business logic -- every rule lives in the service. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/cards")
public class CardController {

    private final CardService service;

    public CardController(CardService service) {
        this.service = service;
    }

    @GetMapping
    public PageResponse<CardSummary> list(
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) CardStatus status,
            @PageableDefault(size = 20, sort = "createdAt",
                             direction = Sort.Direction.DESC) Pageable pageable) {
        return service.list(employeeId, status, pageable);
    }

    @GetMapping("/{id}")
    public CardDetail get(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/{id}/timeline")
    public List<CardTimelineEntry> timeline(@PathVariable Long id) {
        return service.timeline(id);
    }

    @GetMapping(value = "/{id}/qr", produces = MediaType.IMAGE_PNG_VALUE)
    public byte[] qr(@PathVariable Long id, @RequestParam(defaultValue = "300") int size) {
        return service.qrImage(id, size);
    }

    @GetMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    public ResponseEntity<byte[]> pdf(@PathVariable Long id) {
        CardPdf pdf = service.pdf(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"%s.pdf\"".formatted(pdf.serial()))
                .body(pdf.bytes());
    }

    @GetMapping("/{id}/photo")
    public ResponseEntity<byte[]> photo(@PathVariable Long id) {
        CardPhoto photo = service.photo(id);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_TYPE, photo.contentType())
                .body(photo.bytes());
    }

    @GetMapping("/by-serial/{serial}")
    public CardVerification verify(@PathVariable String serial) {
        return service.verifyBySerial(serial);
    }

    @PostMapping("/{id}/report-lost")
    public CardDetail reportLost(@PathVariable Long id) { return service.reportLost(id); }

    @PostMapping("/{id}/report-damaged")
    public CardDetail reportDamaged(@PathVariable Long id) { return service.reportDamaged(id); }

    @PostMapping("/{id}/suspend")
    public CardDetail suspend(@PathVariable Long id) { return service.suspend(id); }

    @PostMapping("/{id}/reinstate")
    public CardDetail reinstate(@PathVariable Long id) { return service.reinstate(id); }

    @PostMapping("/{id}/revoke")
    public CardDetail revoke(@PathVariable Long id, @RequestBody @Valid ReasonRequest body) {
        return service.revoke(id, body.reason());
    }

    @PostMapping("/{id}/void")
    public CardDetail voidCard(@PathVariable Long id, @RequestBody @Valid ReasonRequest body) {
        return service.voidCard(id, body.reason());
    }

    @PostMapping("/{id}/regenerate-credentials")
    public CardDetail regenerateCredentials(@PathVariable Long id) {
        return service.regenerateCredentials(id);
    }
}
