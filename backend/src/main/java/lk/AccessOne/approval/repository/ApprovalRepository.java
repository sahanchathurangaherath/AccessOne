package lk.AccessOne.approval.repository;

import lk.AccessOne.approval.domain.Approval;
import lk.AccessOne.shared.enums.Decision;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Collection;
import java.util.Optional;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    Optional<Approval> findByRequestId(Long requestId);

    long countByDecisionInAndDecidedAtGreaterThanEqual(Collection<Decision> decisions, LocalDateTime from);

    /**
     * DATEDIFF returns INT, and AVG over INT does integer division -- 23.8
     * hours would silently report as 23. The CAST is what prevents it.
     */
    @Query(value = """
           SELECT ROUND(AVG(CAST(DATEDIFF(HOUR, r.submitted_at, a.decided_at) AS DECIMAL(10,2))), 1)
           FROM dbo.approvals a
           JOIN dbo.card_requests r ON r.id = a.card_request_id
           WHERE a.decision IN ('APPROVED', 'REJECTED')
             AND a.decided_at >= :since
           """, nativeQuery = true)
    BigDecimal averageTurnaroundHours(@Param("since") LocalDateTime since);

    @Query("""
           select a from Approval a
           join fetch a.request r
           join fetch r.employee e
           join fetch e.department
           left join fetch a.verifiedBy
           left join fetch a.decidedBy
           left join fetch r.documents
           where a.request.id = :requestId
           """)
    Optional<Approval> findDetailByRequestId(@Param("requestId") Long requestId);

    @Query(value = """
           select a from Approval a
           join fetch a.request r
           join fetch r.employee e
           left join fetch a.decidedBy
           where a.decision in ('APPROVED', 'REJECTED')
             and (:deciderId is null or a.decidedBy.id = :deciderId)
           """,
           countQuery = """
           select count(a) from Approval a
           where a.decision in ('APPROVED', 'REJECTED')
             and (:deciderId is null or a.decidedBy.id = :deciderId)
           """)
    Page<Approval> findHistory(@Param("deciderId") Long deciderId, Pageable pageable);
}
