package lk.AccessOne.identity.security;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.enums.AuditAction;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.security.core.Authentication;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** The LOGIN half lives in LoginEventListener; this is LOGOUT's counterpart. */
@Component
public class AuditingLogoutSuccessHandler implements LogoutSuccessHandler {

    private final UserRepository users;
    private final ApplicationEventPublisher events;

    public AuditingLogoutSuccessHandler(UserRepository users, ApplicationEventPublisher events) {
        this.users = users;
        this.events = events;
    }

    /**
     * @Transactional matters here: AuditEventListener only fires on
     * AFTER_COMMIT, and a TransactionalEventListener published with no
     * transaction in progress is silently dropped, not run synchronously.
     * The logout filter itself opens no transaction.
     */
    @Override
    @Transactional
    public void onLogoutSuccess(HttpServletRequest request, HttpServletResponse response,
                                Authentication authentication) {
        if (authentication != null) {
            users.findByUsername(authentication.getName()).ifPresent(user ->
                    events.publishEvent(new AuditEvent("users", user.getId(),
                                                        AuditAction.LOGOUT, null, null)));
        }
        response.setStatus(HttpServletResponse.SC_NO_CONTENT);
    }
}
