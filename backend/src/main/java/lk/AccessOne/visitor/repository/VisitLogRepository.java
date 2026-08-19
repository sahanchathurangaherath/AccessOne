package lk.AccessOne.visitor.repository;

import lk.AccessOne.visitor.domain.VisitLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface VisitLogRepository extends JpaRepository<VisitLog, Long> {

    @Query("select l from VisitLog l where l.pass.id = :passId and l.checkOutAt is null")
    Optional<VisitLog> findOpenForPass(@Param("passId") Long passId);
}
