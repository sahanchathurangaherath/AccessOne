package lk.AccessOne.card.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * uq_cardqrnfc_card and no is_current column: one credential row per card,
 * updated in place when regenerated. The previous payload survives in
 * audit_logs, which is where history belongs.
 *
 * card_qr_nfc_data has no created_at/updated_at columns -- it records
 * generated_at instead, so (same reasoning as AuditLog) it cannot extend
 * BaseEntity/AuditableEntity without a column name mismatch under
 * ddl-auto: validate.
 */
@Entity
@Table(name = "card_qr_nfc_data")
public class CardCredential {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "card_id", nullable = false, unique = true)
    private IdCard card;

    @Column(name = "qr_payload", nullable = false, length = 255)
    private String qrPayload;

    /** NCHAR(64), not NVARCHAR -- a SHA-256 hex digest is always exactly 64 characters. */
    @Column(name = "qr_hash", nullable = false, unique = true, columnDefinition = "NCHAR(64)")
    private String qrHash;

    /** Base64 of AES-256-GCM ciphertext. NVARCHAR(MAX), not binary. */
    @Column(name = "nfc_payload", columnDefinition = "NVARCHAR(MAX)")
    private String nfcPayload;

    /** chk_cardqrnfc_nfcformat: NDEF_TEXT, NDEF_URI or MIFARE_BLOCK. */
    @Column(name = "nfc_format", length = 30)
    private String nfcFormat;

    @Column(name = "encoding_algorithm", nullable = false, length = 30)
    private String encodingAlgorithm;

    @Column(name = "generated_at", nullable = false)
    private LocalDateTime generatedAt = LocalDateTime.now(ZoneOffset.UTC);

    protected CardCredential() { }

    public CardCredential(IdCard card, String qrPayload, String qrHash,
                           String nfcPayload, String nfcFormat, String encodingAlgorithm) {
        this.card = card;
        this.qrPayload = qrPayload;
        this.qrHash = qrHash;
        this.nfcPayload = nfcPayload;
        this.nfcFormat = nfcFormat;
        this.encodingAlgorithm = encodingAlgorithm;
    }

    public void regenerate(String qrPayload, String qrHash, String nfcPayload, String nfcFormat) {
        this.qrPayload = qrPayload;
        this.qrHash = qrHash;
        this.nfcPayload = nfcPayload;
        this.nfcFormat = nfcFormat;
        this.generatedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Long getId()                    { return id; }
    public IdCard getCard()                { return card; }
    public String getQrPayload()           { return qrPayload; }
    public String getQrHash()              { return qrHash; }
    public String getNfcPayload()          { return nfcPayload; }
    public String getNfcFormat()           { return nfcFormat; }
    public String getEncodingAlgorithm()   { return encodingAlgorithm; }
    public LocalDateTime getGeneratedAt()  { return generatedAt; }
}
