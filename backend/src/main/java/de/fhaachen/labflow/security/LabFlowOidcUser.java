package de.fhaachen.labflow.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.OidcUserInfo;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;

import java.nio.charset.StandardCharsets;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.UUID;

public final class LabFlowOidcUser implements OidcUser, LabFlowPrincipal {

    private final OidcUser delegate;
    private final UUID id;
    private final String username;
    private final String displayName;
    private final String labId;
    private final String labName;
    private final LabFlowRole role;
    private final List<GrantedAuthority> authorities;

    private LabFlowOidcUser(
            OidcUser delegate,
            UUID id,
            String username,
            String displayName,
            String labId,
            String labName,
            LabFlowRole role
    ) {
        this.delegate = delegate;
        this.id = id;
        this.username = username;
        this.displayName = displayName;
        this.labId = labId;
        this.labName = labName;
        this.role = role;
        this.authorities = List.of(new SimpleGrantedAuthority(role.authority()));
    }

    public static LabFlowOidcUser from(
            OidcUser source,
            LabFlowOidcRoleMappingProperties roleMapping
    ) {
        Objects.requireNonNull(source, "source must not be null");
        Objects.requireNonNull(roleMapping, "roleMapping must not be null");

        String subject = requiredClaim(source, "sub");
        String issuer = source.getIssuer() == null ? "unknown-issuer" : source.getIssuer().toString();
        UUID id = UUID.nameUUIDFromBytes((issuer + "|" + subject).getBytes(StandardCharsets.UTF_8));
        String username = firstClaim(source, "email", "preferred_username");
        String displayName = firstClaim(source, "name", "preferred_username", "email");
        String roleClaim = optionalClaim(source, "labflow_role");
        String labId;
        String labName;
        LabFlowRole role;

        if (roleClaim != null) {
            role = parseRole(roleClaim);
            labId = requiredClaim(source, "lab_id");
            labName = requiredClaim(source, "lab_name");
        } else {
            role = roleMapping.roleFor(identityClaims(source));
            labId = roleMapping.labId();
            labName = roleMapping.labName();
        }

        return new LabFlowOidcUser(source, id, username, displayName, labId, labName, role);
    }

    private static Set<String> identityClaims(OidcUser source) {
        Set<String> identities = new LinkedHashSet<>();
        addClaimValues(identities, source, "sub");
        addClaimValues(identities, source, "preferred_username");
        addClaimValues(identities, source, "nickname");
        addClaimValues(identities, source, "email");
        addClaimValues(identities, source, "groups");
        addClaimValues(identities, source, "groups_direct");
        addClaimValues(identities, source, "https://gitlab.org/claims/groups/owner");
        addClaimValues(identities, source, "https://gitlab.org/claims/groups/maintainer");
        addClaimValues(identities, source, "https://gitlab.org/claims/groups/developer");
        return Set.copyOf(identities);
    }

    private static void addClaimValues(Set<String> identities, OidcUser source, String name) {
        Object claim = source.getClaim(name);
        if (claim instanceof Collection<?> values) {
            values.stream()
                    .filter(String.class::isInstance)
                    .map(String.class::cast)
                    .map(String::trim)
                    .filter(value -> !value.isBlank())
                    .forEach(identities::add);
            return;
        }
        if (claim instanceof String value && !value.isBlank()) {
            identities.add(value.trim());
        }
    }

    private static LabFlowRole parseRole(String claim) {
        String normalized = claim.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        try {
            return LabFlowRole.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unsupported labflow_role claim: " + claim, exception);
        }
    }

    private static String firstClaim(OidcUser source, String... names) {
        for (String name : names) {
            String value = source.getClaimAsString(name);
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        throw new IllegalArgumentException("OIDC identity is missing claim " + String.join(" or ", names));
    }

    private static String requiredClaim(OidcUser source, String name) {
        String value = optionalClaim(source, name);
        if (value == null) {
            throw new IllegalArgumentException("OIDC identity is missing claim " + name);
        }
        return value;
    }

    private static String optionalClaim(OidcUser source, String name) {
        String value = source.getClaimAsString(name);
        return value == null || value.isBlank() ? null : value.trim();
    }

    @Override
    public UUID id() {
        return id;
    }

    @Override
    public String username() {
        return username;
    }

    @Override
    public String displayName() {
        return displayName;
    }

    @Override
    public String labId() {
        return labId;
    }

    @Override
    public String labName() {
        return labName;
    }

    @Override
    public LabFlowRole role() {
        return role;
    }

    @Override
    public Map<String, Object> getClaims() {
        return delegate.getClaims();
    }

    @Override
    public OidcUserInfo getUserInfo() {
        return delegate.getUserInfo();
    }

    @Override
    public OidcIdToken getIdToken() {
        return delegate.getIdToken();
    }

    @Override
    public Map<String, Object> getAttributes() {
        return delegate.getAttributes();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return authorities;
    }

    @Override
    public String getName() {
        return username;
    }
}
