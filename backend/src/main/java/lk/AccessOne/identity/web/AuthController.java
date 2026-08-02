package lk.AccessOne.identity.web;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lk.AccessOne.identity.security.AccessOneUserDetails;
import lk.AccessOne.shared.web.ApiPaths;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping(ApiPaths.API_V1 + "/auth")
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;

    public AuthController(AuthenticationManager authenticationManager,
                          SecurityContextRepository contextRepository) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
    }

    public record LoginRequest(@NotBlank String username, @NotBlank String password) { }

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
