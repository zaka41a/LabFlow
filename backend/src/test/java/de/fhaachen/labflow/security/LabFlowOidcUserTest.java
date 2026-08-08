package de.fhaachen.labflow.security;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

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
                new DefaultOidcUser(List.of(), token, "sub")
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
}
