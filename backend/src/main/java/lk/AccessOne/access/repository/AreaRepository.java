package lk.AccessOne.access.repository;

import lk.AccessOne.access.domain.Area;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AreaRepository extends JpaRepository<Area, Long> {

    Optional<Area> findByAreaCode(String areaCode);

    List<Area> findByActiveTrueOrderByBuildingAscAreaNameAsc();

    boolean existsByAreaCodeIgnoreCase(String areaCode);

    long countByActiveTrueAndRestrictedTrue();
}
