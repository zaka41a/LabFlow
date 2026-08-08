package de.fhaachen.labflow.security;

import org.springframework.security.core.CredentialsContainer;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.io.Serial;
import java.io.Serializable;
import java.util.Collection;
import java.util.List;
import java.util.Objects;
import java.util.UUID;

public final class LabFlowUserDetails
        implements UserDetails, CredentialsContainer, LabFlowPrincipal, Serializable {

    @Serial
    private static final long serialVersionUID = 1L;

    private final UUID id;
    private final String username;
    private final String displayName;
    private final String labId;
    private final String labName;
    private final LabFlowRole role;
    private final List<GrantedAuthority> authorities;
    private String password;

    public LabFlowUserDetails(LabFlowSecurityProperties.UserAccount account) {
        this.id = account.id();
        this.username = account.username();
        this.password = account.passwordHash();
        this.displayName = account.displayName();
        this.labId = account.labId();
        this.labName = account.labName();
        this.role = account.role();
        this.authorities = List.of(new SimpleGrantedAuthority(account.role().authority()));
    }

    public UUID id() {
        return id;
    }

    @Override
    public String username() {
        return username;
    }

    public String displayName() {
        return displayName;
    }

    public String labId() {
        return labId;
    }

    public String labName() {
        return labName;
    }

    public LabFlowRole role() {
        return role;
    }

    @Override
    public String getName() {
        return username;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getPassword() {
        return password;
    }

    @Override
    public String getUsername() {
        return username;
    }

    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    @Override
    public boolean isEnabled() {
        return true;
    }

    @Override
    public void eraseCredentials() {
        password = null;
    }

    @Override
    public boolean equals(Object candidate) {
        return this == candidate
                || candidate instanceof LabFlowUserDetails other
                && username.equals(other.username);
    }

    @Override
    public int hashCode() {
        return Objects.hash(username);
    }
}
