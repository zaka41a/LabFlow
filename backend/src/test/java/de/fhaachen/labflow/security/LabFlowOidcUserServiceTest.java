package de.fhaachen.labflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

import java.time.Instant;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LabFlowOidcUserServiceTest {

    @Test
    void rejectsAnIdentityWithoutLabFlowClaimsAsAnAuthenticationFailure() {
        Instant issuedAt = Instant.parse("2026-08-08T12:00:00Z");
        OidcIdToken token = OidcIdToken.withTokenValue("signed-id-token")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(300))
                .issuer("https://identity.fh-aachen.de/realms/labflow")
                .subject("incomplete-person")
                .claim("email", "incomplete@fh-aachen.de")
                .claim("name", "Incomplete Identity")
                .build();
        DefaultOidcUser identity = new DefaultOidcUser(List.of(), token, "sub");
        LabFlowOidcUserService service = new LabFlowOidcUserService(
                ignored -> identity,
                emptyRoleMapping()
        );

        assertThatThrownBy(() -> service.loadUser(null))
                .isInstanceOfSatisfying(OAuth2AuthenticationException.class, exception -> {
                    assertThat(exception.getError().getErrorCode())
                            .isEqualTo(LabFlowOidcUserService.INVALID_IDENTITY_ERROR);
                    assertThat(exception.getCause())
                            .isInstanceOf(IllegalArgumentException.class)
                            .hasMessageContaining("role assignment");
                });
    }

    private static LabFlowOidcRoleMappingProperties emptyRoleMapping() {
        return new LabFlowOidcRoleMappingProperties(
                List.of(),
                List.of(),
                List.of(),
                "FH_AACHEN",
                "Labor FH Aachen"
        );
    }
}
