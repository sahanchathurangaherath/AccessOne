package lk.AccessOne.shared.audit;

import lk.AccessOne.identity.security.AccessOneUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * Replaces the Phase 2 SystemUserProvider placeholder. Every AuditEvent
 * published anywhere in the system now records the real user, with no
 * change to any service — that is what the CurrentUserProvider interface
 * bought.
 */
@Component
public class SecurityCurrentUserProvider implements CurrentUserProvider {

    @Override
    public String currentUsername() {
        return principal().map(AccessOneUserDetails::getUsername).orElse("SYSTEM");
    }

    @Override
    public Long currentUserId() {
        return principal().map(AccessOneUserDetails::getUserId).orElse(null);
    }

    private Optional<AccessOneUserDetails> principal() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated()
                || !(auth.getPrincipal() instanceof AccessOneUserDetails details)) {
            return Optional.empty();
        }
        return Optional.of(details);
    }
}
