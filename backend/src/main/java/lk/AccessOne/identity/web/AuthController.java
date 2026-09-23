package lk.AccessOne.identity.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lk.AccessOne.identity.domain.PasswordResetToken;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.PasswordResetTokenRepository;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.identity.security.AccessOneUserDetails;
import lk.AccessOne.notification.service.EmailService;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.web.ApiPaths;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final PasswordResetTokenRepository resetTokens;
    private final EmailService emailService;
    private final String portalBaseUrl;

    public AuthController(AuthenticationManager authenticationManager,
                          SecurityContextRepository contextRepository,
                          UserRepository users,
                          PasswordEncoder passwordEncoder,
                          PasswordResetTokenRepository resetTokens,
                          EmailService emailService,
                          @Value("${accessone.mail.portal-base-url:http://localhost:3000}") String portalBaseUrl) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.resetTokens = resetTokens;
        this.emailService = emailService;
        this.portalBaseUrl = portalBaseUrl;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) { }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
            @NotBlank @Size(min = 8, max = 100)
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                     message = "Password must contain at least one letter and one number")
            String newPassword) { }

    public record ForgotPasswordRequest(@NotBlank String identifier) { }

    public record ResetPasswordRequest(
            @NotBlank String token,
            @NotBlank @Size(min = 8, max = 100)
            @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$",
                     message = "Password must contain at least one letter and one number")
            String newPassword) { }

    public record CurrentUser(Long userId, String username, Long employeeId,
                              String role, List<String> permissions) { }

    @PostMapping("/login")
    public ResponseEntity<CurrentUser> login(@RequestBody @Valid LoginRequest body,
                                             HttpServletRequest request,
                                             HttpServletResponse response) {

        Authentication authentication = authenticationManager.authenticate(
                UsernamePasswordAuthenticationToken.unauthenticated(
                        body.username(), body.password()));

        // Spring Security 6+ requires the context to be saved explicitly.
        // Forgetting this is why "login succeeds but the next request is 401".
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);

        return ResponseEntity.ok(toCurrentUser(authentication));
    }

    @GetMapping("/me")
    public CurrentUser me(Authentication authentication) {
        return toCurrentUser(authentication);
    }

    /** Called by the frontend on load so the XSRF-TOKEN cookie exists. */
    @GetMapping("/csrf")
    public ResponseEntity<Void> csrf() {
        return ResponseEntity.noContent().build();
    }

    /** Claims a pre-provisioned account by replacing its temporary password. */
    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void changePassword(@RequestBody @Valid ChangePasswordRequest body,
                               Authentication authentication) {
        AccessOneUserDetails principal = (AccessOneUserDetails) authentication.getPrincipal();
        User user = users.findById(principal.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User", principal.getUserId()));

        if (!passwordEncoder.matches(body.currentPassword(), user.getPasswordHash())) {
            throw new BusinessRuleException("wrong-current-password", "Current password is incorrect");
        }

        user.changePassword(passwordEncoder.encode(body.newPassword()));
    }

    /** Initiates password reset by sending a time-limited token to user's registered email. */
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void forgotPassword(@RequestBody @Valid ForgotPasswordRequest body) {
        users.findByUsernameOrEmailIgnoreCase(body.identifier().trim()).ifPresent(user -> {
            if (user.getEmployee() != null && user.getEmployee().getEmail() != null) {
                String token = UUID.randomUUID().toString().replace("-", "")
                        + UUID.randomUUID().toString().replace("-", "");
                LocalDateTime expiresAt = LocalDateTime.now(ZoneOffset.UTC).plusMinutes(15);
                resetTokens.save(new PasswordResetToken(user, token, expiresAt));

                String resetLink = portalBaseUrl + "/login?resetToken=" + token;
                emailService.sendHtmlEmail(
                        user.getEmployee().getEmail(),
                        "AccessOne Password Reset Request",
                        "password-reset",
                        Map.of(
                                "username", user.getUsername(),
                                "resetLink", resetLink
                        )
                );
            }
        });
    }

    /** Resets password using an unexpired reset token. */
    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void resetPassword(@RequestBody @Valid ResetPasswordRequest body) {
        PasswordResetToken token = resetTokens.findByTokenHashWithUser(body.token())
                .orElseThrow(() -> new BusinessRuleException("invalid-token", "Password reset link is invalid or has expired."));

        if (token.isUsed() || token.isExpired()) {
            throw new BusinessRuleException("invalid-token", "Password reset link is invalid or has expired.");
        }

        User user = token.getUser();
        user.changePassword(passwordEncoder.encode(body.newPassword()));
        token.markUsed();

        if (user.getEmployee() != null && user.getEmployee().getEmail() != null) {
            emailService.sendHtmlEmail(
                    user.getEmployee().getEmail(),
                    "AccessOne Password Changed Successfully",
                    "password-changed",
                    Map.of(
                            "username", user.getUsername(),
                            "loginUrl", portalBaseUrl + "/login"
                    )
            );
        }
    }

    private CurrentUser toCurrentUser(Authentication authentication) {
        AccessOneUserDetails principal = (AccessOneUserDetails) authentication.getPrincipal();

        String role = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> a.startsWith("ROLE_"))
                .map(a -> a.substring(5))
                .findFirst().orElse("UNKNOWN");

        List<String> permissions = principal.getAuthorities().stream()
                .map(GrantedAuthority::getAuthority)
                .filter(a -> !a.startsWith("ROLE_"))
                .sorted().toList();

        return new CurrentUser(principal.getUserId(), principal.getUsername(),
                               principal.getEmployeeId(), role, permissions);
    }
}
