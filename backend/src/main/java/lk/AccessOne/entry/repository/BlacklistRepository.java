package lk.AccessOne.entry.repository;

import lk.AccessOne.entry.domain.BlacklistEntry;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface BlacklistRepository extends JpaRepository<BlacklistEntry, Long> {

    /**
     * Both checks run on every entry attempt. Backed by the filtered
     * covering indexes from V70 (idx_blacklist_active_card /
     * idx_blacklist_active_visitor), so neither touches the table.
     */
    @Query("select count(b) > 0 from BlacklistEntry b where b.cardId = :cardId and b.active = true")
    boolean isCardBlacklisted(@Param("cardId") Long cardId);

    @Query("select count(b) > 0 from BlacklistEntry b where b.visitorId = :visitorId and b.active = true")
    boolean isVisitorBlacklisted(@Param("visitorId") Long visitorId);

    @Query(value = "select b from BlacklistEntry b order by b.blacklistedAt desc",
           countQuery = "select count(b) from BlacklistEntry b")
    Page<BlacklistEntry> findAllOrdered(Pageable pageable);
}
