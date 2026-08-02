package lk.AccessOne.shared.audit;

import org.springframework.stereotype.Component;

/**
 * Phase 2 placeholder. Phase 3 replaces this with a Spring Security-backed
 * implementation that reads the authenticated principal. Everything that
 * depends on "who did this" is written against the interface, so that
 * substitution changes exactly one class.
 */
@Component
public class SystemUserProvider implements CurrentUserProvider {

    @Override public String currentUsername() { return "SYSTEM"; }

    @Override public Long currentUserId() { return null; }
}
