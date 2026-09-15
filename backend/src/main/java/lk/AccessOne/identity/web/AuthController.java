package lk.AccessOne.identity.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.identity.security.AccessOneUserDetails;
import lk.AccessOne.shared.error.BusinessRuleException;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.web.ApiPaths;
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

import java.util.List;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public AuthController(AuthenticationManager authenticationManager,
                          SecurityContextRepository contextRepository,
                          UserRepository users,
                          PasswordEncoder passwordEncoder) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) { }

    public record ChangePasswordRequest(
            @NotBlank String currentPassword,
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
