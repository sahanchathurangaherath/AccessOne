package lk.AccessOne.approval.repository;

import lk.AccessOne.cardrequest.domain.CardRequest;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Reads dbo.v_pending_request_queue -- built in the database migrations,
 * already computing hours_pending and ageing_flag. Deliberately not an
 * @Entity: Hibernate's schema validator inspects tables, not views, and
 * mapping one is a reliable way to break startup. A native query with an
 * interface projection reads it without fighting ddl-auto: validate.
 *
 * The generic type is CardRequest purely so Spring Data JPA has a real
 * managed entity to bootstrap repository metadata from -- every method
 * below is a native @Query with its own projection type and has nothing
 * to do with CardRequest CRUD. Repository<Object, Long> looks more
 * "correct" but fails at startup: Hibernate has no managed type named
 * Object to resolve.
 */
public interface PendingQueueRepository extends Repository<CardRequest, Long> {

    interface QueueRow {
        Long getRequestId();
        String getRequestNo();
        String getRequestType();
        String getStatus();
        LocalDateTime getSubmittedAt();
        String getEmpId();
        String getEmployeeName();
        String getDesignation();
        String getDeptName();
        String getApprovalDecision();
        Integer getHoursPending();
        String getAgeingFlag();
    }

    // SQL Server paging: OFFSET ... FETCH NEXT, not MySQL's LIMIT -- and
    // ORDER BY is mandatory before OFFSET, since paging an unordered
    // result is meaningless anyway.
    @Query(value = """
           SELECT request_id AS requestId, request_no AS requestNo,
                  request_type AS requestType, status,
                  submitted_at AS submittedAt, emp_id AS empId,
                  employee_name AS employeeName, designation,
                  dept_name AS deptName, approval_decision AS approvalDecision,
                  hours_pending AS hoursPending, ageing_flag AS ageingFlag
           FROM dbo.v_pending_request_queue
           WHERE (:ageing IS NULL OR ageing_flag = :ageing)
           ORDER BY submitted_at ASC
           OFFSET :offset ROWS FETCH NEXT :size ROWS ONLY
           """, nativeQuery = true)
    List<QueueRow> findQueue(@Param("ageing") String ageing,
                             @Param("offset") int offset,
                             @Param("size") int size);

    @Query(value = """
           SELECT COUNT(*) FROM dbo.v_pending_request_queue
           WHERE (:ageing IS NULL OR ageing_flag = :ageing)
           """, nativeQuery = true)
    long countQueue(@Param("ageing") String ageing);
}
