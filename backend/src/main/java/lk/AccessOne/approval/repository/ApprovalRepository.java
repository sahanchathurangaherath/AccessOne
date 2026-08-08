package lk.AccessOne.approval.repository;

import lk.AccessOne.approval.domain.Approval;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface ApprovalRepository extends JpaRepository<Approval, Long> {

    Optional<Approval> findByRequestId(Long requestId);

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
