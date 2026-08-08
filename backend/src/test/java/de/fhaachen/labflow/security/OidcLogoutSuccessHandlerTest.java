package de.fhaachen.labflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.InMemoryClientRegistrationRepository;
import org.springframework.security.oauth2.core.AuthorizationGrantType;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.security.oauth2.core.oidc.OidcIdToken;
import org.springframework.security.oauth2.core.oidc.user.DefaultOidcUser;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

class OidcLogoutSuccessHandlerTest {

    @Test
    void oidcLogoutEndsTheProviderSessionAndReturnsToLabFlow() throws Exception {
        ClientRegistration registration = ClientRegistration.withRegistrationId("labflow")
                .clientId("labflow-web")
                .clientAuthenticationMethod(ClientAuthenticationMethod.NONE)
                .authorizationGrantType(AuthorizationGrantType.AUTHORIZATION_CODE)
                .redirectUri("{baseUrl}/login/oauth2/code/{registrationId}")
                .scope("openid", "profile", "email")
                .authorizationUri("http://keycloak.localhost:8180/realms/labflow/auth")
                .tokenUri("http://keycloak:8080/realms/labflow/token")
                .jwkSetUri("http://keycloak:8080/realms/labflow/certs")
                .userInfoUri("http://keycloak:8080/realms/labflow/userinfo")
                .userNameAttributeName("sub")
                .providerConfigurationMetadata(Map.of(
                        "end_session_endpoint",
                        "http://keycloak.localhost:8180/realms/labflow/logout"
                ))
                .clientName("FH Aachen SSO")
                .build();
        Instant issuedAt = Instant.parse("2026-08-08T12:00:00Z");
        OidcIdToken idToken = OidcIdToken.withTokenValue("signed-id-token")
                .issuedAt(issuedAt)
                .expiresAt(issuedAt.plusSeconds(300))
                .subject("borrower")
                .build();
        DefaultOidcUser principal = new DefaultOidcUser(
                List.of(new SimpleGrantedAuthority("ROLE_BORROWER")),
                idToken,
                "sub"
        );
        OAuth2AuthenticationToken authentication = new OAuth2AuthenticationToken(
                principal,
                principal.getAuthorities(),
                "labflow"
        );
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setScheme("http");
        request.setServerName("localhost");
        request.setServerPort(80);
        request.setRequestURI("/api/auth/logout");
        MockHttpServletResponse response = new MockHttpServletResponse();
        SecurityConfiguration configuration = new SecurityConfiguration();

        configuration.logoutSuccessHandler(
                new InMemoryClientRegistrationRepository(registration)
        ).onLogoutSuccess(request, response, authentication);

        assertThat(response.getRedirectedUrl())
                .startsWith("http://keycloak.localhost:8180/realms/labflow/logout?")
                .contains("id_token_hint=signed-id-token")
                .contains("post_logout_redirect_uri=http://localhost/");
    }
}
