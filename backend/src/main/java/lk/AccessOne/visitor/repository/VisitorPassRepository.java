package lk.AccessOne.visitor.repository;

import lk.AccessOne.shared.enums.PassStatus;
import lk.AccessOne.visitor.domain.VisitorPass;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface VisitorPassRepository extends JpaRepository<VisitorPass, Long> {

    Optional<VisitorPass> findByQrPayload(String qrPayload);

    /**
     * findByPassNoForDecision fetch-joins the access level AND its
     * permitted areas, because Phase 12 calls permits() outside a
     * transaction. Without that join it's a LazyInitializationException
     * at the exact moment someone is standing at a door.
     */
    @Query("""
           select p from VisitorPass p
           join fetch p.visitor v
           join fetch p.hostEmployee
           join fetch p.accessLevel l
           left join fetch l.permittedAreas
           where p.passNo = :passNo
           """)
    Optional<VisitorPass> findByPassNoForDecision(@Param("passNo") String passNo);

    @Query("""
           select p from VisitorPass p
           join fetch p.visitor v
           join fetch p.hostEmployee
           join fetch p.accessLevel
           where p.id = :id
           """)
    Optional<VisitorPass> findDetailById(@Param("id") Long id);

    @Query(value = """
           select p from VisitorPass p
           join fetch p.visitor v
           join fetch p.hostEmployee
           where (:status is null or p.status = :status)
           """,
           countQuery = """
           select count(p) from VisitorPass p
           where (:status is null or p.status = :status)
           """)
    Page<VisitorPass> search(@Param("status") PassStatus status, Pageable pageable);

    /**
     * "Live" means still occupying the one-credential-per-visitor slot --
     * not yet closed by expiry, cancellation or return. Used to refuse a
     * second pass while one is already outstanding.
     */
    Optional<VisitorPass> findFirstByVisitorIdAndStatusIn(Long visitorId, Collection<PassStatus> liveStatuses);

    @Query("""
           select p from VisitorPass p
           where p.status in ('ISSUED', 'ACTIVE')
             and p.validUntil < :now
           """)
    List<VisitorPass> findLapsed(@Param("now") LocalDateTime now);

    long countByVisitorId(Long visitorId);

    /**
     * Still-live passes lapsing inside the window -- used both for the
     * security dashboard tile and for the host-notification sweep. Only
     * ISSUED/ACTIVE passes count: one already expired, cancelled or
     * returned is not "about to" do anything.
     */
    @Query("""
           select p from VisitorPass p
           join fetch p.visitor v
           join fetch p.hostEmployee
           where p.status in ('ISSUED', 'ACTIVE')
             and p.validUntil between :from and :to
           """)
    List<VisitorPass> findExpiringBetween(@Param("from") LocalDateTime from, @Param("to") LocalDateTime to);
}
