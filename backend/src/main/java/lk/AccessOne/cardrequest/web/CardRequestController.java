package lk.AccessOne.cardrequest.web;

import jakarta.validation.Valid;
import lk.AccessOne.cardrequest.service.CardRequestService;
import lk.AccessOne.cardrequest.service.RequestDocumentService;
import lk.AccessOne.cardrequest.web.dto.CardRequestDetail;
import lk.AccessOne.cardrequest.web.dto.CardRequestSummary;
import lk.AccessOne.cardrequest.web.dto.CreateCardRequest;
import lk.AccessOne.cardrequest.web.dto.DocumentSummary;
import lk.AccessOne.cardrequest.web.dto.RequestTimelineEntry;
import lk.AccessOne.shared.enums.DocumentType;
import lk.AccessOne.shared.enums.RequestStatus;
import lk.AccessOne.shared.web.ApiPaths;
import lk.AccessOne.shared.web.PageResponse;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/** Thin. DTOs in, DTOs out, no business logic -- every rule lives in the service. */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/requests")
public class CardRequestController {

    private final CardRequestService service;
    private final RequestDocumentService documents;

    public CardRequestController(CardRequestService service, RequestDocumentService documents) {
        this.service = service;
        this.documents = documents;
    }

    @GetMapping
    public PageResponse<CardRequestSummary> list(
            @RequestParam(required = false) RequestStatus status,
            @PageableDefault(size = 20, sort = "createdAt",
                             direction = Sort.Direction.DESC) Pageable pageable) {
        return service.search(status, pageable);
    }

    @GetMapping("/{id}")
    public CardRequestDetail get(@PathVariable Long id) {
        return service.findById(id);
    }

    @GetMapping("/{id}/timeline")
    public List<RequestTimelineEntry> timeline(@PathVariable Long id) {
        return service.timeline(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public CardRequestDetail create(@RequestBody @Valid CreateCardRequest body) {
        return service.create(body);
    }

    @PutMapping("/{id}")
    public CardRequestDetail update(@PathVariable Long id,
                                    @RequestBody @Valid CreateCardRequest body) {
        return service.update(id, body);
    }

    @PostMapping(value = "/{id}/photo", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public CardRequestDetail uploadPhoto(@PathVariable Long id,
                                         @RequestPart("file") MultipartFile file) {
        return service.uploadPhoto(id, file);
    }

    @PostMapping("/{id}/submit")
    public CardRequestDetail submit(@PathVariable Long id) { return service.submit(id); }

    @PostMapping("/{id}/withdraw")
    public CardRequestDetail withdraw(@PathVariable Long id) { return service.withdraw(id); }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) { service.delete(id); }

    @PostMapping(value = "/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public DocumentSummary upload(@PathVariable Long id,
                                  @RequestPart("file") MultipartFile file,
                                  @RequestParam DocumentType documentType) {
        return documents.upload(id, documentType, file);
    }

    @DeleteMapping("/{id}/documents/{docId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteDocument(@PathVariable Long id, @PathVariable Long docId) {
        documents.delete(id, docId);
    }

    @GetMapping("/{id}/documents/{docId}/download")
    public ResponseEntity<Resource> download(@PathVariable Long id,
                                             @PathVariable Long docId) {
        return documents.download(id, docId);
    }
}
