package lk.AccessOne.access.repository;

import lk.AccessOne.access.domain.AccessLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AccessLevelRepository extends JpaRepository<AccessLevel, Long> {

    Optional<AccessLevel> findByLevelCode(String levelCode);

    List<AccessLevel> findByActiveTrueOrderByLevelName();

    boolean existsByLevelCodeIgnoreCase(String levelCode);

    /**
     * distinct matters here: a fetch join across a to-many returns one row
     * per level-area pair, so five levels with four areas each come back
     * as twenty AccessLevel references to the same five objects. Without
     * distinct the matrix screen shows duplicates.
     */
    @Query("""
           select distinct l from AccessLevel l
           left join fetch l.permittedAreas
           order by l.levelCode
           """)
    List<AccessLevel> findAllWithAreas();

    @Query("""
           select l from AccessLevel l
           left join fetch l.permittedAreas
           where l.id = :id
           """)
    Optional<AccessLevel> findWithAreas(@Param("id") Long id);

    @Query("select count(l) from AccessLevel l join l.permittedAreas a where a.id = :areaId")
    long countGrantingArea(@Param("areaId") Long areaId);

    long countByActiveTrue();
}
