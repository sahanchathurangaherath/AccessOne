package lk.AccessOne.shared.security;

import lk.AccessOne.identity.security.AccessOneUserDetails;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Arrays;

/**
 * The role check, the "who am I" lookup, and the record-level ownership
 * decision that Module 1 wrote inline, generalised so every module makes
 * this decision the same way rather than five people each deciding it
 * separately.
 */
@Component
public class OwnershipGuard {

    public boolean hasAnyRole(String... roles) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null) return false;
        return auth.getAuthorities().stream()
                .map(a -> a.getAuthority())
                .anyMatch(a -> Arrays.stream(roles).anyMatch(r -> a.equals("ROLE_" + r)));
    }

    public Long currentEmployeeId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null && auth.getPrincipal() instanceof AccessOneUserDetails d
                ? d.getEmployeeId() : null;
    }

    /**
     * 404 rather than 403 when the caller may not see a record. A 403
     * confirms it exists, which is information they are not entitled to.
     */
    public void requireOwnerOr(Long ownerEmployeeId, String label, Object id,
                               String... privilegedRoles) {
        if (hasAnyRole(privilegedRoles)) return;
        Long mine = currentEmployeeId();
        if (mine == null || !mine.equals(ownerEmployeeId)) {
            throw new ResourceNotFoundException(label, id);
        }
    }

    /** True when the caller may see a record owned by the given employee. */
    public boolean canView(Long ownerEmployeeId, String... privilegedRoles) {
        if (hasAnyRole(privilegedRoles)) return true;
        Long mine = currentEmployeeId();
        return mine != null && mine.equals(ownerEmployeeId);
    }
}
