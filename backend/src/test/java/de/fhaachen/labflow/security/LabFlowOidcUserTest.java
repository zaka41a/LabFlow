package de.fhaachen.labflow.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LabFlowOidcUserTest {

    @ParameterizedTest
    @EnumSource(LabFlowRole.class)
    void mapsTrustedIdentityClaimsToTheLabFlowPrincipal(LabFlowRole role) {
        Instant issuedAt = Instant.parse("2026-08-07T10:00:00Z");
        OidcIdToken token = OidcIdToken.withTokenValue("signed-id-token")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(300))
                .issuer("https://identity.fh-aachen.de/realms/labflow")
                .subject("person-123")
                .claim("email", "user@fh-aachen.de")
                .claim("name", "Erika Muster")
                .claim("lab_id", "FH_AACHEN")
                .claim("lab_name", "Labor FH Aachen")
                .claim("labflow_role", role.name())
                .build();

        LabFlowOidcUser principal = LabFlowOidcUser.from(
                new DefaultOidcUser(List.of(), token, "sub"),
                emptyRoleMapping()
        );

        assertThat(principal.username()).isEqualTo("user@fh-aachen.de");
        assertThat(principal.displayName()).isEqualTo("Erika Muster");
        assertThat(principal.labId()).isEqualTo("FH_AACHEN");
        assertThat(principal.labName()).isEqualTo("Labor FH Aachen");
        assertThat(principal.role()).isEqualTo(role);
        assertThat(principal.getAuthorities())
                .extracting("authority")
                .containsExactly(role.authority());
    }

    @ParameterizedTest
    @EnumSource(LabFlowRole.class)
    void mapsConfiguredGitLabIdentityToTheLabFlowPrincipal(LabFlowRole role) {
        Instant issuedAt = Instant.parse("2026-08-08T18:00:00Z");
        OidcIdToken token = OidcIdToken.withTokenValue("gitlab-id-token")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(300))
                .issuer("https://git-ce.rwth-aachen.de")
                .subject("3991")
                .claim("preferred_username", "zaka41a")
                .claim("name", "Zakaria Sabiri")
                .build();
        LabFlowOidcRoleMappingProperties mapping = switch (role) {
            case BORROWER -> mapping(List.of("ZAKA41A"), List.of(), List.of());
            case LAB_MANAGER -> mapping(List.of(), List.of("zaka41a"), List.of());
            case TECHNICIAN -> mapping(List.of(), List.of(), List.of("zaka41a"));
        };

        LabFlowOidcUser principal = LabFlowOidcUser.from(
                new DefaultOidcUser(List.of(), token, "sub"),
                mapping
        );

        assertThat(principal.username()).isEqualTo("zaka41a");
        assertThat(principal.displayName()).isEqualTo("Zakaria Sabiri");
        assertThat(principal.labId()).isEqualTo("FH_AACHEN");
        assertThat(principal.labName()).isEqualTo("Labor FH Aachen");
        assertThat(principal.role()).isEqualTo(role);
    }

    @ParameterizedTest
    @EnumSource(LabFlowRole.class)
    void mapsGitLabGroupMembershipToTheLabFlowPrincipal(LabFlowRole role) {
        Instant issuedAt = Instant.parse("2026-08-08T18:30:00Z");
        String group = "lsit-2026/roles/labflow/" + switch (role) {
            case BORROWER -> "borrower";
            case LAB_MANAGER -> "lab-manager";
            case TECHNICIAN -> "technician";
        };
        OidcIdToken token = OidcIdToken.withTokenValue("gitlab-group-id-token")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(300))
                .issuer("https://git-ce.rwth-aachen.de")
                .subject("4000")
                .claim("preferred_username", "additional-user")
                .claim("name", "Additional User")
                .claim("groups_direct", List.of(group))
                .build();
        LabFlowOidcRoleMappingProperties mapping = switch (role) {
            case BORROWER -> mapping(List.of(group), List.of(), List.of());
            case LAB_MANAGER -> mapping(List.of(), List.of(group), List.of());
            case TECHNICIAN -> mapping(List.of(), List.of(), List.of(group));
        };

        LabFlowOidcUser principal = LabFlowOidcUser.from(
                new DefaultOidcUser(List.of(), token, "sub"),
                mapping
        );

        assertThat(principal.role()).isEqualTo(role);
    }

    @Test
    void ignoresRoleGroupsInheritedFromAParentGitLabGroup() {
        Instant issuedAt = Instant.parse("2026-08-08T18:45:00Z");
        OidcIdToken token = OidcIdToken.withTokenValue("gitlab-inherited-groups-token")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(300))
                .issuer("https://git-ce.rwth-aachen.de")
                .subject("4001")
                .claim("preferred_username", "parent-group-owner")
                .claim("name", "Parent Group Owner")
                .claim("groups", List.of(
                        "lsit-2026/roles/labflow/borrower",
                        "lsit-2026/roles/labflow/lab-manager",
                        "lsit-2026/roles/labflow/technician"
                ))
                .build();
        LabFlowOidcRoleMappingProperties mapping = mapping(
                List.of("lsit-2026/roles/labflow/borrower"),
                List.of("lsit-2026/roles/labflow/lab-manager"),
                List.of("lsit-2026/roles/labflow/technician")
        );

        assertThatThrownBy(() -> LabFlowOidcUser.from(
                        new DefaultOidcUser(List.of(), token, "sub"),
                        mapping
                ))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("no LabFlow role assignment");
    }

    @Test
    void ignoresInheritedPermissionClaimsWhenUsernameHasAnExplicitRole() {
        Instant issuedAt = Instant.parse("2026-08-08T19:00:00Z");
        OidcIdToken token = OidcIdToken.withTokenValue("gitlab-owner-token")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(300))
                .issuer("https://git-ce.rwth-aachen.de")
                .subject("3991")
                .claim("preferred_username", "zaka41a")
                .claim("name", "Zakaria Sabiri")
                .claim("https://gitlab.org/claims/groups/owner", List.of(
                        "lsit-2026/roles/labflow/borrower",
                        "lsit-2026/roles/labflow/lab-manager",
                        "lsit-2026/roles/labflow/technician"
                ))
                .build();
        LabFlowOidcRoleMappingProperties mapping = mapping(
                List.of("zaka41a", "lsit-2026/roles/labflow/borrower"),
                List.of("lsit-2026/roles/labflow/lab-manager"),
                List.of("lsit-2026/roles/labflow/technician")
        );

        LabFlowOidcUser principal = LabFlowOidcUser.from(
                new DefaultOidcUser(List.of(), token, "sub"),
                mapping
        );

        assertThat(principal.role()).isEqualTo(LabFlowRole.BORROWER);
    }

    private static LabFlowOidcRoleMappingProperties emptyRoleMapping() {
        return mapping(List.of(), List.of(), List.of());
    }

    private static LabFlowOidcRoleMappingProperties mapping(
            List<String> borrowers,
            List<String> managers,
            List<String> technicians
    ) {
        return new LabFlowOidcRoleMappingProperties(
                borrowers,
                managers,
                technicians,
                "FH_AACHEN",
                "Labor FH Aachen"
        );
    }
}
