package lk.AccessOne.organisation.repository;

import lk.AccessOne.organisation.domain.Employee;
import lk.AccessOne.shared.enums.EmploymentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface EmployeeRepository extends JpaRepository<Employee, Long> {

    Optional<Employee> findByEmpId(String empId);

    Optional<Employee> findByEmailIgnoreCase(String email);

    Page<Employee> findByDepartmentIdAndEmploymentStatus(
            Long departmentId, EmploymentStatus status, Pageable pageable);

    @Query("""
           select e from Employee e
           join fetch e.department
           where e.employmentStatus = :status
           """)
    List<Employee> findAllWithDepartment(@Param("status") EmploymentStatus status);

    long countByDepartmentIdAndEmploymentStatus(Long departmentId, EmploymentStatus status);

    long countByDepartmentId(Long departmentId);

    @Query(value = """
           select e from Employee e
           join fetch e.department d
           where (:query is null or :query = ''
                  or lower(e.empId) like lower(concat('%', :query, '%'))
                  or lower(e.firstName) like lower(concat('%', :query, '%'))
                  or lower(e.lastName) like lower(concat('%', :query, '%'))
                  or lower(e.email) like lower(concat('%', :query, '%'))
                  or lower(e.designation) like lower(concat('%', :query, '%'))
                  or lower(d.deptName) like lower(concat('%', :query, '%')))
             and (:departmentId is null or d.id = :departmentId)
             and (:status is null or e.employmentStatus = :status)
           """,
           countQuery = """
           select count(e) from Employee e
           join e.department d
           where (:query is null or :query = ''
                  or lower(e.empId) like lower(concat('%', :query, '%'))
                  or lower(e.firstName) like lower(concat('%', :query, '%'))
                  or lower(e.lastName) like lower(concat('%', :query, '%'))
                  or lower(e.email) like lower(concat('%', :query, '%'))
                  or lower(e.designation) like lower(concat('%', :query, '%'))
                  or lower(d.deptName) like lower(concat('%', :query, '%')))
             and (:departmentId is null or d.id = :departmentId)
             and (:status is null or e.employmentStatus = :status)
           """)
    Page<Employee> searchEmployees(
            @Param("query") String query,
            @Param("departmentId") Long departmentId,
            @Param("status") EmploymentStatus status,
            Pageable pageable);
}
