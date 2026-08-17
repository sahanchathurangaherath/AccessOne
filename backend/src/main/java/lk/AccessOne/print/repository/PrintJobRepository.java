package lk.AccessOne.print.repository;

import lk.AccessOne.print.domain.PrintJob;
import lk.AccessOne.shared.enums.PrintStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface PrintJobRepository extends JpaRepository<PrintJob, Long> {

    /**
     * "Open" is anything still somewhere in the pipeline -- queued,
     * in progress, printed, or QC-passed and awaiting dispatch. Only a
     * CANCELLED or QC_FAILED job is closed, which is what lets a reprint
     * (a brand new job) be queued after a failure.
     */
    boolean existsByCardIdAndStatusNotIn(Long cardId, Collection<PrintStatus> closedStatuses);

    /** Module 4's void check, per the integration contract -- a card with any print job cannot be voided. */
    boolean existsByCardId(Long cardId);

    @Query(value = """
           select j from PrintJob j
           join fetch j.card c
           join fetch c.employee e
           join fetch e.department
           where (:status is null or j.status = :status)
           order by j.queuedAt asc
           """,
           countQuery = """
           select count(j) from PrintJob j
           where (:status is null or j.status = :status)
           """)
    Page<PrintJob> search(@Param("status") PrintStatus status, Pageable pageable);

    @Query("""
           select j from PrintJob j
           join fetch j.card c
           join fetch c.employee e
           join fetch e.department
           where j.id = :id
           """)
    Optional<PrintJob> findDetailById(@Param("id") Long id);
}
