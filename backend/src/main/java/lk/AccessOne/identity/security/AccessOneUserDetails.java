package lk.AccessOne.identity.security;

import lk.AccessOne.identity.domain.User;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

public class AccessOneUserDetails implements UserDetails {

    private final Long userId;
    private final Long employeeId;
    private final String username;
    private final String passwordHash;
    private final boolean active;
    private final boolean locked;
    private final List<GrantedAuthority> authorities;

    public AccessOneUserDetails(User user) {
        this.userId       = user.getId();
        this.employeeId   = user.getEmployee() == null ? null : user.getEmployee().getId();
        this.username     = user.getUsername();
        this.passwordHash = user.getPasswordHash();
        this.active       = user.isActive();
        this.locked       = user.isLocked();

        List<GrantedAuthority> granted = new ArrayList<>();
        granted.add(new SimpleGrantedAuthority("ROLE_" + user.getRole().getRoleName()));
        user.getRole().getPermissions()
            .forEach(p -> granted.add(new SimpleGrantedAuthority(p.getPermissionCode())));
        this.authorities = List.copyOf(granted);
    }

    public Long getUserId()     { return userId; }
    public Long getEmployeeId() { return employeeId; }

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String  getPassword()             { return passwordHash; }
    @Override public String  getUsername()             { return username; }
    @Override public boolean isEnabled()               { return active; }
    @Override public boolean isAccountNonLocked()      { return !locked; }
    @Override public boolean isAccountNonExpired()     { return true; }
    @Override public boolean isCredentialsNonExpired() { return true; }
}
