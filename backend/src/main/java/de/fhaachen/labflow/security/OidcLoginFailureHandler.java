package de.fhaachen.labflow.security;

import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.web.authentication.AuthenticationFailureHandler;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.UUID;

@Component
final class OidcLoginFailureHandler implements AuthenticationFailureHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(OidcLoginFailureHandler.class);

    @Override
    public void onAuthenticationFailure(
            HttpServletRequest request,
            HttpServletResponse response,
            AuthenticationException exception
    ) throws IOException, ServletException {
        String reference = UUID.randomUUID().toString();
        String reason = publicReason(exception);

        LOGGER.warn("OpenID Connect login failed [reference={}]", reference, exception);
        response.sendRedirect(
                "/?login=oidc_error&reason=" + reason + "&reference=" + reference
        );
    }

    private static String publicReason(AuthenticationException exception) {
        Throwable current = exception;
        while (current != null) {
            if (current instanceof OAuth2AuthenticationException oauthException) {
                return switch (oauthException.getError().getErrorCode()) {
                    case LabFlowOidcUserService.INVALID_IDENTITY_ERROR -> "role";
                    case "authorization_request_not_found", "invalid_state_parameter" -> "session";
                    case "invalid_client", "invalid_token_response" -> "client";
                    case "invalid_id_token" -> "token";
                    default -> "provider";
                };
            }
            current = current.getCause();
        }
        return "provider";
    }
}
