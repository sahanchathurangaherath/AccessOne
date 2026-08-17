package lk.AccessOne.print.repository;

import lk.AccessOne.print.domain.DispatchRecord;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface DispatchRecordRepository extends JpaRepository<DispatchRecord, Long> {

    Optional<DispatchRecord> findByPrintJobId(Long printJobId);

    @Query("""
           select d from DispatchRecord d
           join fetch d.printJob j
           join fetch j.card c
           join fetch c.employee e
           where d.id = :id
           """)
    Optional<DispatchRecord> findDetailById(@Param("id") Long id);

    @Query(value = """
           select d from DispatchRecord d
           join fetch d.printJob j
           join fetch j.card c
           join fetch c.employee e
           """,
           countQuery = "select count(d) from DispatchRecord d")
    Page<DispatchRecord> findAllDetailed(Pageable pageable);
}
