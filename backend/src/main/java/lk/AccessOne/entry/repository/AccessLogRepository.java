package lk.AccessOne.entry.repository;

import lk.AccessOne.entry.domain.AccessLog;
import lk.AccessOne.shared.enums.AccessDecision;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface AccessLogRepository extends JpaRepository<AccessLog, Long> {

    @Query(value = """
           select l from AccessLog l
           where (:credentialRef is null or l.credentialRef = :credentialRef)
             and (:areaId is null or l.areaId = :areaId)
             and (:decision is null or l.decision = :decision)
             and (:from is null or l.accessTime >= :from)
             and (:to is null or l.accessTime <= :to)
           order by l.accessTime desc
           """,
           countQuery = """
           select count(l) from AccessLog l
           where (:credentialRef is null or l.credentialRef = :credentialRef)
             and (:areaId is null or l.areaId = :areaId)
             and (:decision is null or l.decision = :decision)
             and (:from is null or l.accessTime >= :from)
             and (:to is null or l.accessTime <= :to)
           """)
    Page<AccessLog> search(@Param("credentialRef") String credentialRef,
                            @Param("areaId") Long areaId,
                            @Param("decision") AccessDecision decision,
                            @Param("from") LocalDateTime from,
                            @Param("to") LocalDateTime to,
                            Pageable pageable);

    /**
     * "How many times has this credential been refused recently" -- runs
     * after every denial. Backed by idx_accesslogs_denials (V70), a
     * filtered index on DENIED rows only.
     */
    @Query(value = """
           SELECT COUNT(*) FROM dbo.access_logs
           WHERE credential_ref = :ref
             AND decision = 'DENIED'
             AND access_time >= :since
           """, nativeQuery = true)
    long countRecentDenials(@Param("ref") String ref, @Param("since") LocalDateTime since);

    @Query(value = """
           SELECT denial_reason AS denialReason, COUNT(*) AS cnt
           FROM dbo.access_logs
           WHERE decision = 'DENIED'
             AND (:from IS NULL OR access_time >= :from)
           GROUP BY denial_reason
           ORDER BY cnt DESC
           """, nativeQuery = true)
    List<DenialCountRow> denialsByReason(@Param("from") LocalDateTime from);

    interface DenialCountRow {
        String getDenialReason();
        long getCnt();
    }

    /** The security dashboard tile. Reconciles against the same SQL run directly in SSMS. */
    @Query(value = """
           SELECT COUNT(*) FROM dbo.access_logs
           WHERE decision = 'DENIED' AND CAST(access_time AS DATE) = CAST(SYSUTCDATETIME() AS DATE)
           """, nativeQuery = true)
    long countDeniedToday();
}
