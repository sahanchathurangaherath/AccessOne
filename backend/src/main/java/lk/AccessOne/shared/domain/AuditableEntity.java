package lk.AccessOne.shared.domain;

import jakarta.persistence.Column;
import jakarta.persistence.MappedSuperclass;
import org.springframework.data.annotation.LastModifiedDate;

import java.time.LocalDateTime;

@MappedSuperclass
public abstract class AuditableEntity extends BaseEntity {

    /**
     * SQL Server has no ON UPDATE CURRENT_TIMESTAMP. This column is
     * maintained by Spring Data auditing rather than the database.
     */
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public LocalDateTime getUpdatedAt() { return updatedAt; }
}
