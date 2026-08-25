package lk.AccessOne.entry.repository;

import lk.AccessOne.entry.domain.SecurityAlert;
import lk.AccessOne.shared.enums.AlertStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;

public interface SecurityAlertRepository extends JpaRepository<SecurityAlert, Long> {

    /** Backed by idx_alerts_open (V70) when status = OPEN. */
    @Query(value = """
           select a from SecurityAlert a
           where (:status is null or a.status = :status)
           order by a.createdAt desc
           """,
           countQuery = """
           select count(a) from SecurityAlert a
           where (:status is null or a.status = :status)
           """)
    Page<SecurityAlert> search(@Param("status") AlertStatus status, Pageable pageable);

    /**
     * security_alerts has no credential_ref column of its own -- the join
     * back through related_access_log_id is how "is there already an open
     * REPEATED_DENIAL alert for this credential" gets answered, so a
     * persistent attempt doesn't bury the dashboard in duplicates.
     */
    @Query(value = """
           SELECT COUNT(*) FROM dbo.security_alerts sa
           JOIN dbo.access_logs al ON al.id = sa.related_access_log_id
           WHERE al.credential_ref = :ref
             AND sa.alert_type = 'REPEATED_DENIAL'
             AND sa.status = 'OPEN'
             AND sa.created_at >= :since
           """, nativeQuery = true)
    long countOpenRepeatedDenialAlerts(@Param("ref") String ref, @Param("since") LocalDateTime since);
}
