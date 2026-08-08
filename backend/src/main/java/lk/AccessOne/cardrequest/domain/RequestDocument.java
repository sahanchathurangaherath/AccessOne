package lk.AccessOne.cardrequest.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lk.AccessOne.shared.enums.DocumentType;
import org.hibernate.Hibernate;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * request_documents has no updated_at column -- an uploaded file is never
 * modified, only replaced -- so this stands apart from BaseEntity /
 * AuditableEntity the same way AuditLog does, and maintains its own
 * uploaded_at rather than relying on Spring Data auditing's created_at name.
 */
@Entity
@Table(name = "request_documents")
public class RequestDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_request_id", nullable = false)
    private CardRequest request;

    @Enumerated(EnumType.STRING)
    @Column(name = "document_type", nullable = false, length = 30)
    private DocumentType documentType;

    @Column(name = "file_name", nullable = false, length = 150)
    private String fileName;

    @Column(name = "file_path", nullable = false, length = 255)
    private String filePath;

    @Column(name = "mime_type", nullable = false, length = 80)
    private String mimeType;

    @Column(name = "file_size_bytes", nullable = false)
    private int fileSizeBytes;

    @Column(name = "uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;

    protected RequestDocument() { }

    public RequestDocument(DocumentType type, String fileName, String filePath,
                            String mimeType, int fileSizeBytes) {
        this.documentType = type;
        this.fileName = fileName;
        this.filePath = filePath;
        this.mimeType = mimeType;
        this.fileSizeBytes = fileSizeBytes;
        this.uploadedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    void attachTo(CardRequest request) { this.request = request; }

    public Long getId()               { return id; }
    public CardRequest getRequest()   { return request; }
    public DocumentType getDocumentType() { return documentType; }
    public String getFileName()       { return fileName; }
    public String getFilePath()       { return filePath; }
    public String getMimeType()       { return mimeType; }
    public int getFileSizeBytes()     { return fileSizeBytes; }
    public LocalDateTime getUploadedAt() { return uploadedAt; }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof RequestDocument that)) return false;
        if (!getClass().equals(Hibernate.getClass(other))) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
