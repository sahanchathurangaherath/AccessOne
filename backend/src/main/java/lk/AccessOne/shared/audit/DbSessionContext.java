package lk.AccessOne.shared.audit;

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class DbSessionContext {

    @PersistenceContext
    private EntityManager entityManager;

    /**
     * Must be called inside the transaction whose changes should be attributed.
     * HikariCP reuses connections, so session context set on one request would
     * otherwise leak into the next.
     *
     * Called from the Phase 3 security filter once a principal exists.
     */
    @Transactional
    public void identify(String username) {
        entityManager.createNativeQuery(
                "EXEC sys.sp_set_session_context @key = N'app_username', @value = :u")
            .setParameter("u", username)
            .executeUpdate();
    }
}
