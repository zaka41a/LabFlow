package de.fhaachen.labflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;

import static org.assertj.core.api.Assertions.assertThat;

class OidcLoginFailureHandlerTest {

    private final OidcLoginFailureHandler handler = new OidcLoginFailureHandler();

    @Test
    void reportsMissingRoleWithoutExposingProviderDetails() throws Exception {
        MockHttpServletResponse response = handle(
                new OAuth2AuthenticationException(
                        new OAuth2Error(LabFlowOidcUserService.INVALID_IDENTITY_ERROR),
                        "Sensitive identity details"
                )
        );

        assertThat(response.getRedirectedUrl())
                .startsWith("/?login=oidc_error&reason=role&reference=")
                .doesNotContain("Sensitive");
    }

    @Test
    void distinguishesAnExpiredAuthorizationSession() throws Exception {
        MockHttpServletResponse response = handle(
                new OAuth2AuthenticationException(
                        new OAuth2Error("authorization_request_not_found")
                )
        );

        assertThat(response.getRedirectedUrl())
                .startsWith("/?login=oidc_error&reason=session&reference=");
    }

    @Test
    void identifiesATokenExchangeConfigurationFailure() throws Exception {
        MockHttpServletResponse response = handle(
                new OAuth2AuthenticationException(
                        new OAuth2Error("invalid_token_response")
                )
        );

        assertThat(response.getRedirectedUrl())
                .startsWith("/?login=oidc_error&reason=client&reference=");
    }

    @Test
    void groupsUnexpectedProviderFailuresUnderASafeReason() throws Exception {
        MockHttpServletResponse response = handle(
                new AuthenticationServiceException("Provider returned a secret response")
        );

        assertThat(response.getRedirectedUrl())
                .startsWith("/?login=oidc_error&reason=provider&reference=")
                .doesNotContain("secret");
    }

    private MockHttpServletResponse handle(AuthenticationException exception)
            throws Exception {
        MockHttpServletResponse response = new MockHttpServletResponse();
        handler.onAuthenticationFailure(new MockHttpServletRequest(), response, exception);
        return response;
    }
}
