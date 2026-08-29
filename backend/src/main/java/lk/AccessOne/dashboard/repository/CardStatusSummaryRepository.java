package lk.AccessOne.dashboard.repository;

import lk.AccessOne.card.domain.IdCard;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;

import java.util.List;

/**
 * Reads dbo.v_card_status_summary -- built in V3, and otherwise unread by
 * the application until this dashboard. Deliberately not an @Entity, same
 * reasoning as PendingQueueRepository: Hibernate's schema validator
 * inspects tables, not views.
 */
public interface CardStatusSummaryRepository extends Repository<IdCard, Long> {

    interface DeptCardStatusRow {
        Long getDepartmentId();
        String getDeptCode();
        String getDeptName();
        int getTotalCards();
        int getActiveCards();
        int getInProgressCards();
        int getRevokedCards();
        int getSuspendedCards();
        int getLostOrDamagedCards();
        int getReplacedCards();
    }

    @Query(value = """
           SELECT department_id AS departmentId, dept_code AS deptCode, dept_name AS deptName,
                  total_cards AS totalCards, active_cards AS activeCards,
                  in_progress_cards AS inProgressCards, revoked_cards AS revokedCards,
                  suspended_cards AS suspendedCards, lost_or_damaged_cards AS lostOrDamagedCards,
                  replaced_cards AS replacedCards
           FROM dbo.v_card_status_summary
           ORDER BY dept_name
           """, nativeQuery = true)
    List<DeptCardStatusRow> findAll();
}
