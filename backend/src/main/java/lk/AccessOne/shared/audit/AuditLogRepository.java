package lk.AccessOne.shared.audit;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityNameAndEntityIdOrderByPerformedAtAsc(String entityName, Long entityId);
}
