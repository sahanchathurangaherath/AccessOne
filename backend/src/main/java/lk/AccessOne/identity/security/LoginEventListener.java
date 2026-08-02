package lk.AccessOne.identity.security;

import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.shared.audit.AuditEvent;
import lk.AccessOne.shared.enums.AuditAction;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.context.event.EventListener;
import org.springframework.security.authentication.event.AuthenticationFailureBadCredentialsEvent;
import org.springframework.security.authentication.event.AuthenticationSuccessEvent;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Component
public class LoginEventListener {

    private final UserRepository users;
    private final ApplicationEventPublisher events;

    public LoginEventListener(UserRepository users, ApplicationEventPublisher events) {
        this.users = users;
        this.events = events;
    }

    @EventListener
    @Transactional
    public void onSuccess(AuthenticationSuccessEvent event) {
        String username = event.getAuthentication().getName();
        users.findByUsername(username).ifPresent(user -> {
            user.recordSuccessfulLogin();
            events.publishEvent(new AuditEvent("users", user.getId(),
                                               AuditAction.LOGIN, null, null));
        });
    }

    /**
     * Deliberately narrower than AbstractAuthenticationFailureEvent: a
     * disabled or locked account's login attempt also publishes a failure
     * event (AuthenticationFailureDisabledEvent / ...LockedEvent), but that
     * is not a wrong password guess and should not count toward the lockout
     * threshold. Only bad-credentials failures do — which, since
     * DaoAuthenticationProvider hides "no such user" as bad credentials by
     * default, also covers a username that does not exist. That lookup
     * reveals nothing to the caller either way; findByUsername simply
     * returns empty and there is nothing to update.
     */
    @EventListener
    @Transactional
    public void onFailure(AuthenticationFailureBadCredentialsEvent event) {
        String username = String.valueOf(event.getAuthentication().getPrincipal());
        users.findByUsername(username).ifPresent(User::recordFailedLogin);
    }
}
