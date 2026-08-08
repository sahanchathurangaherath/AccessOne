package lk.AccessOne.cardrequest.repository;

import lk.AccessOne.cardrequest.domain.CardRequest;
import lk.AccessOne.shared.enums.RequestStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.Optional;

public interface CardRequestRepository extends JpaRepository<CardRequest, Long> {

    /**
     * Fetch joins matter here. The list screen shows the employee name and
     * department; with lazy loading and open-in-view off, a plain findAll
     * gives one query per row on the first, and a LazyInitializationException
     * on the second.
     */
    @Query(value = """
           select r from CardRequest r
           join fetch r.employee e
           join fetch e.department
           where (:employeeId is null or e.id = :employeeId)
             and (:status is null or r.status = :status)
           """,
           countQuery = """
           select count(r) from CardRequest r
           where (:employeeId is null or r.employee.id = :employeeId)
             and (:status is null or r.status = :status)
           """)
    Page<CardRequest> search(@Param("employeeId") Long employeeId,
                              @Param("status") RequestStatus status,
                              Pageable pageable);

    @Query("""
           select r from CardRequest r
           join fetch r.employee e
           join fetch e.department
           left join fetch r.requestedAccessLevel
           left join fetch r.documents
           where r.id = :id
           """)
    Optional<CardRequest> findDetailById(@Param("id") Long id);

    boolean existsByEmployeeIdAndStatusIn(Long employeeId, Collection<RequestStatus> statuses);
}
