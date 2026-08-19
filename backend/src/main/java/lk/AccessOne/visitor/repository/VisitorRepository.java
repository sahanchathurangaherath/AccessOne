package lk.AccessOne.visitor.repository;

import lk.AccessOne.visitor.domain.Visitor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface VisitorRepository extends JpaRepository<Visitor, Long> {

    @Query("""
           select v from Visitor v
           join fetch v.hostEmployee h
           join fetch h.department
           where v.deleted = false
             and (:search is null
                  or lower(v.fullName) like lower(concat('%', :search, '%'))
                  or v.idDocumentNo = :search
                  or v.visitorCode = :search)
           """)
    Page<Visitor> search(@Param("search") String search, Pageable pageable);

    boolean existsByIdDocumentNoAndDeletedFalse(String documentNo);
}
