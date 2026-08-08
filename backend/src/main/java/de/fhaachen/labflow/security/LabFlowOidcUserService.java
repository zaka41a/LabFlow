package de.fhaachen.labflow.security;

import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

@Component
public class LabFlowOidcUserService {

    private final OidcUserService delegate = new OidcUserService();

    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        return LabFlowOidcUser.from(delegate.loadUser(request));
    }
}
