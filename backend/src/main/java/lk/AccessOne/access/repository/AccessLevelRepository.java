package lk.AccessOne.access.repository;

import lk.AccessOne.access.domain.AccessLevel;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AccessLevelRepository extends JpaRepository<AccessLevel, Long> {

    Optional<AccessLevel> findByLevelCode(String levelCode);

    List<AccessLevel> findByActiveTrueOrderByLevelName();
}
