package lk.AccessOne.cardrequest.service;

import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.cardrequest.domain.RequestDocument;
import lk.AccessOne.cardrequest.repository.RequestDocumentRepository;
import lk.AccessOne.cardrequest.web.dto.DocumentSummary;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.enums.AuditAction;
import lk.AccessOne.shared.enums.DocumentType;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.service.EntityLookup;
import lk.AccessOne.shared.storage.FileStorageService;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.net.MalformedURLException;
import java.nio.file.Path;

@Service
public class RequestDocumentService {

    private final CardRequestService cardRequests;
    private final RequestDocumentRepository documents;
    private final FileStorageService storage;
    private final CardRequestMapper mapper;
    private final ApplicationEventPublisher events;
    private final EntityLookup lookup;

    public RequestDocumentService(CardRequestService cardRequests, RequestDocumentRepository documents,
                                   FileStorageService storage, CardRequestMapper mapper,
                                   ApplicationEventPublisher events, EntityLookup lookup) {
        this.cardRequests = cardRequests;
        this.documents = documents;
        this.storage = storage;
        this.mapper = mapper;
        this.events = events;
        this.lookup = lookup;
    }

    @Transactional
    public DocumentSummary upload(Long requestId, DocumentType type, MultipartFile file) {
        CardRequest request = cardRequests.loadOwned(requestId);
        String path = storage.store("requests", requestId, file,
                FileStorageService.DOCUMENTS, 5L * 1024 * 1024);

        RequestDocument document = new RequestDocument(
                type, file.getOriginalFilename(), path,
                file.getContentType(), (int) file.getSize());
        request.addDocument(document);
        documents.save(document);

        events.publishEvent(new AuditEvent("card_requests", requestId, AuditAction.UPDATE, null,
                "{\"document_added\":\"%s\"}".formatted(type.name())));

        return mapper.toDocument(document);
    }

    @Transactional
    public void delete(Long requestId, Long documentId) {
        CardRequest request = cardRequests.loadOwned(requestId);
        RequestDocument document = lookup.require(request.getDocuments().stream()
                .filter(d -> d.getId().equals(documentId))
                .findFirst(), "Document", documentId);

        request.removeDocument(document);
        documents.delete(document);
    }

    @Transactional(readOnly = true)
    public ResponseEntity<Resource> download(Long requestId, Long documentId) {
        CardRequest request = cardRequests.loadOwned(requestId);
        RequestDocument document = lookup.require(request.getDocuments().stream()
                .filter(d -> d.getId().equals(documentId))
                .findFirst(), "Document", documentId);

        Path path = storage.resolve(document.getFilePath());
        Resource resource;
        try {
            resource = new UrlResource(path.toUri());
        } catch (MalformedURLException e) {
            throw new ResourceNotFoundException("Document", documentId);
        }
        if (!resource.exists()) {
            throw new ResourceNotFoundException("Document", documentId);
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(document.getMimeType()))
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        "attachment; filename=\"%s\"".formatted(document.getFileName()))
                .body(resource);
    }
}
