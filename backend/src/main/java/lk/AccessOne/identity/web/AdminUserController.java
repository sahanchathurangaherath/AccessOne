package lk.AccessOne.identity.web;

import lk.AccessOne.identity.domain.User;
import lk.AccessOne.identity.repository.UserRepository;
import lk.AccessOne.shared.error.ResourceNotFoundException;
import lk.AccessOne.shared.web.ApiPaths;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * A locked account with no administrator route to unlock it is a system you
 * can lock yourself out of. Restricted to SYSTEM_ADMIN by SecurityConfig.
 */
@RestController
@RequestMapping(ApiPaths.API_V1 + "/admin/users")
public class AdminUserController {

    private final UserRepository users;

    public AdminUserController(UserRepository users) {
        this.users = users;
    }

    @PostMapping("/{id}/unlock")
    @Transactional
    public ResponseEntity<Void> unlock(@PathVariable Long id) {
        User user = users.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User", id));
        user.unlock();
        return ResponseEntity.noContent().build();
    }
}
