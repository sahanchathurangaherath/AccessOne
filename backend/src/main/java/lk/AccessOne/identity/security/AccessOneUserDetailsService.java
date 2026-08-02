package lk.AccessOne.identity.security;

import lk.AccessOne.identity.repository.UserRepository;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccessOneUserDetailsService implements UserDetailsService {

    private final UserRepository users;

    public AccessOneUserDetailsService(UserRepository users) {
        this.users = users;
    }

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) {
        return users.findByUsernameWithRoleAndPermissions(username)
                    .map(AccessOneUserDetails::new)
                    .orElseThrow(() -> new UsernameNotFoundException("Bad credentials"));
    }
}
