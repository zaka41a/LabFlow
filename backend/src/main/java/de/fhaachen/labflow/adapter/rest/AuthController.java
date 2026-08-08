package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.security.LabFlowRole;
import de.fhaachen.labflow.security.LabFlowPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.web.csrf.CsrfToken;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final int sessionTimeoutSeconds;
    private final boolean oidcEnabled;

    public AuthController(
            @Value("${server.servlet.session.timeout:30m}") Duration sessionTimeout,
            @Value("${labflow.security.oidc.enabled:false}") boolean oidcEnabled
    ) {
        this.sessionTimeoutSeconds = Math.toIntExact(sessionTimeout.toSeconds());
        this.oidcEnabled = oidcEnabled;
    }

    @GetMapping("/csrf")
    public CsrfTokenResponse csrf(CsrfToken csrfToken) {
        return new CsrfTokenResponse(csrfToken.getHeaderName(), csrfToken.getToken());
    }

    @GetMapping("/me")
    public SessionUserResponse currentUser(@AuthenticationPrincipal LabFlowPrincipal user) {
        return new SessionUserResponse(
                user.id(),
                user.username(),
                user.displayName(),
                user.labId(),
                user.labName(),
                List.of(user.role()),
                sessionTimeoutSeconds
        );
    }

    @GetMapping("/config")
    public AuthenticationConfigResponse config() {
        return new AuthenticationConfigResponse(
                true,
                oidcEnabled,
                oidcEnabled ? "/oauth2/authorization/labflow" : null
        );
    }

    public record CsrfTokenResponse(String headerName, String token) {
    }

    public record AuthenticationConfigResponse(
            boolean localLoginEnabled,
            boolean oidcEnabled,
            String oidcLoginUrl
    ) {
    }

    public record SessionUserResponse(
            UUID id,
            String username,
            String displayName,
            String labId,
            String labName,
            List<LabFlowRole> roles,
            int sessionTimeoutSeconds
    ) {
    }
}
