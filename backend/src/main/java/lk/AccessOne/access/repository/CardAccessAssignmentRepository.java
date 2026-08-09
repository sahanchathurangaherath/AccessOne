package lk.AccessOne.access.repository;

import lk.AccessOne.access.domain.CardAccessAssignment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CardAccessAssignmentRepository extends JpaRepository<CardAccessAssignment, Long> {

    @Query("""
           select a from CardAccessAssignment a
           join fetch a.accessLevel
           where a.cardId = :cardId and a.current = true
           """)
    Optional<CardAccessAssignment> findCurrentForCard(@Param("cardId") Long cardId);

    @Query("""
           select a from CardAccessAssignment a
           join fetch a.accessLevel
           join fetch a.assignedBy
           where a.cardId = :cardId
           order by a.validFrom desc, a.id desc
           """)
    List<CardAccessAssignment> findHistoryForCard(@Param("cardId") Long cardId);
}
