package lk.AccessOne.shared.security;

import lk.AccessOne.identity.security.AccessOneUserDetails;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

/**
 * URL rules answer "may this role reach this area of the system at all";
 * this answers "may this specific user act on this specific record". Called
 * from services, not controllers, so the rule holds no matter which entry
 * point reaches it.
 */
@Component("ownership")
public class OwnershipService {

    /** True when the caller is the employee the record belongs to. */
    public boolean isSelf(Long employeeId, Authentication authentication) {
        if (employeeId == null || authentication == null) return false;
        if (!(authentication.getPrincipal() instanceof AccessOneUserDetails details)) return false;
        return employeeId.equals(details.getEmployeeId());
    }
}
