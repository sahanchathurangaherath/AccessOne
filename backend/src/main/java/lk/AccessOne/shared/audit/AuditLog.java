package lk.AccessOne.shared.audit;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.Table;
import lk.AccessOne.shared.enums.AuditAction;
import org.hibernate.Hibernate;

import java.time.LocalDateTime;
import java.time.ZoneOffset;

/**
 * audit_logs has no created_at/updated_at columns — it records performed_at
 * instead, so it cannot extend BaseEntity/AuditableEntity without a column
 * name mismatch under ddl-auto: validate. It is append-only, so that is the
 * only consequence of standing apart from the shared superclasses.
 */
@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "entity_name", nullable = false, length = 60)
    private String entityName;

    @Column(name = "entity_id", nullable = false)
    private Long entityId;

    @Enumerated(EnumType.STRING)
    @Column(name = "action", nullable = false, length = 20)
    private AuditAction action;

    @Lob
    @Column(name = "old_value")
    private String oldValue;

    @Lob
    @Column(name = "new_value")
    private String newValue;

    @Column(name = "performed_by")
    private Long performedBy;

    @Column(name = "performed_by_username", nullable = false, length = 50)
    private String performedByUsername;

    @Column(name = "ip_address", length = 45)
    private String ipAddress;

    @Column(name = "performed_at", nullable = false)
    private LocalDateTime performedAt;

    protected AuditLog() { }

    public AuditLog(String entityName, Long entityId, AuditAction action,
                     String oldValue, String newValue,
                     Long performedBy, String performedByUsername) {
        this.entityName = entityName;
        this.entityId = entityId;
        this.action = action;
        this.oldValue = oldValue;
        this.newValue = newValue;
        this.performedBy = performedBy;
        this.performedByUsername = performedByUsername != null ? performedByUsername : "SYSTEM";
        this.performedAt = LocalDateTime.now(ZoneOffset.UTC);
    }

    public Long getId() { return id; }
    public String getEntityName() { return entityName; }
    public Long getEntityId() { return entityId; }
    public AuditAction getAction() { return action; }
    public String getOldValue() { return oldValue; }
    public String getNewValue() { return newValue; }
    public Long getPerformedBy() { return performedBy; }
    public String getPerformedByUsername() { return performedByUsername; }
    public String getIpAddress() { return ipAddress; }
    public LocalDateTime getPerformedAt() { return performedAt; }

    @Override
    public boolean equals(Object other) {
        if (this == other) return true;
        if (!(other instanceof AuditLog that)) return false;
        if (!getClass().equals(Hibernate.getClass(other))) return false;
        return id != null && id.equals(that.id);
    }

    @Override
    public int hashCode() {
        return getClass().hashCode();
    }
}
