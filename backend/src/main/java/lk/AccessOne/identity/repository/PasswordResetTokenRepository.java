package lk.AccessOne.identity.repository;

import lk.AccessOne.identity.domain.PasswordResetToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PasswordResetTokenRepository extends JpaRepository<PasswordResetToken, Long> {

    @Query("""
           select t from PasswordResetToken t
           join fetch t.user u
           left join fetch u.employee
           where t.tokenHash = :tokenHash
           """)
    Optional<PasswordResetToken> findByTokenHashWithUser(@Param("tokenHash") String tokenHash);
}
