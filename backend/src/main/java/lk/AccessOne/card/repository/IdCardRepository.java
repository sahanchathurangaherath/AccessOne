package lk.AccessOne.card.repository;

import lk.AccessOne.card.domain.IdCard;
import lk.AccessOne.shared.enums.CardStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface IdCardRepository extends JpaRepository<IdCard, Long> {

    @Query(value = """
           select c from IdCard c
           join fetch c.employee e
           join fetch e.department
           where (:employeeId is null or e.id = :employeeId)
             and (:status is null or c.status = :status)
           """,
           countQuery = """
           select count(c) from IdCard c
           where (:employeeId is null or c.employee.id = :employeeId)
             and (:status is null or c.status = :status)
           """)
    Page<IdCard> search(@Param("employeeId") Long employeeId,
                         @Param("status") CardStatus status,
                         Pageable pageable);

    @Query("""
           select c from IdCard c
           join fetch c.employee e
           join fetch e.department
           left join fetch c.accessLevel
           where c.id = :id
           """)
    Optional<IdCard> findDetailById(@Param("id") Long id);

    Optional<IdCard> findByRequestId(Long requestId);

    /**
     * The lookup Phase 12 depends on for every entry attempt, so the
     * employee, access level and its permitted areas all have to come back
     * in the same query -- a second query per scan is not acceptable on
     * that path, and AccessLevel.permits() walks the area set directly.
     */
    @Query("""
           select c from IdCard c
           join fetch c.employee e
           join fetch e.department
           left join fetch c.accessLevel al
           left join fetch al.permittedAreas
           where c.cardSerial = :serial
           """)
    Optional<IdCard> findBySerialWithEmployee(@Param("serial") String serial);

    @Query("select coalesce(max(c.versionNo), 0) from IdCard c where c.employee.id = :employeeId")
    int findLatestVersionFor(@Param("employeeId") Long employeeId);

    /** For EmployeeExited: every card that is still capable of opening a door. */
    List<IdCard> findByEmployeeIdAndStatus(Long employeeId, CardStatus status);

    /** The employee dashboard tile: whatever card is current for this person. */
    Optional<IdCard> findFirstByEmployeeIdOrderByIssueDateDesc(Long employeeId);
}
