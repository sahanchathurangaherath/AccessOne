package lk.AccessOne.shared.audit;

import lk.AccessOne.shared.enums.AuditAction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findByEntityNameAndEntityIdOrderByPerformedAtAsc(String entityName, Long entityId);

    @Query(value = """
           select a from AuditLog a
           where (:entityName is null or a.entityName = :entityName)
             and (:entityId is null or a.entityId = :entityId)
             and (:action is null or a.action = :action)
             and (:username is null or a.performedByUsername = :username)
             and (:from is null or a.performedAt >= :from)
             and (:to is null or a.performedAt < :to)
           """,
           countQuery = """
           select count(a) from AuditLog a
           where (:entityName is null or a.entityName = :entityName)
             and (:entityId is null or a.entityId = :entityId)
             and (:action is null or a.action = :action)
             and (:username is null or a.performedByUsername = :username)
             and (:from is null or a.performedAt >= :from)
             and (:to is null or a.performedAt < :to)
           """)
    Page<AuditLog> search(@Param("entityName") String entityName,
                           @Param("entityId") Long entityId,
                           @Param("action") AuditAction action,
                           @Param("username") String username,
                           @Param("from") LocalDateTime from,
                           @Param("to") LocalDateTime to,
                           Pageable pageable);

    long countByPerformedAtGreaterThanEqual(LocalDateTime from);
}
