package lk.AccessOne.identity.repository;

import lk.AccessOne.identity.domain.Permission;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface PermissionRepository extends JpaRepository<Permission, Long> {

    Optional<Permission> findByPermissionCode(String permissionCode);
}
