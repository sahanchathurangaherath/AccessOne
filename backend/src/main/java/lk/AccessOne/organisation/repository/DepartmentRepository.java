package lk.AccessOne.organisation.repository;

import lk.AccessOne.organisation.domain.Department;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentRepository extends JpaRepository<Department, Long> {

    Optional<Department> findByDeptCode(String deptCode);

    List<Department> findByActiveTrueOrderByDeptName();

    boolean existsByDeptCodeIgnoreCase(String deptCode);
}
