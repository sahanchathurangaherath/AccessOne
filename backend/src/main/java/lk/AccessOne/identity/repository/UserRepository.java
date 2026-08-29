package lk.AccessOne.identity.repository;

import lk.AccessOne.identity.domain.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByUsername(String username);

    boolean existsByUsernameIgnoreCase(String username);

    /** An employee without a login has no row here, hence Optional, not a throw. */
    Optional<User> findByEmployeeIdAndActiveTrue(Long employeeId);

    List<User> findByRoleRoleNameAndActiveTrue(String roleName);

    long countByFailedLoginAttemptsGreaterThan(short threshold);

    /**
     * Role and permissions are LAZY and open-in-view is off, so a plain
     * findByUsername throws LazyInitializationException the moment
     * AccessOneUserDetails touches the permission set.
     */
    @Query("""
           select u from User u
           join fetch u.role r
           left join fetch r.permissions
           left join fetch u.employee
           where u.username = :username
           """)
    Optional<User> findByUsernameWithRoleAndPermissions(@Param("username") String username);
}
