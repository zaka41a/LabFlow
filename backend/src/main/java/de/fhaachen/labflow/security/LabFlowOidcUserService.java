package de.fhaachen.labflow.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserRequest;
import org.springframework.security.oauth2.client.oidc.userinfo.OidcUserService;
import org.springframework.security.oauth2.client.userinfo.OAuth2UserService;
import org.springframework.security.oauth2.core.OAuth2AuthenticationException;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.stereotype.Component;

import java.util.Objects;

@Component
public class LabFlowOidcUserService {

    static final String INVALID_IDENTITY_ERROR = "invalid_labflow_identity";

    private final OAuth2UserService<OidcUserRequest, OidcUser> delegate;
    private final LabFlowOidcRoleMappingProperties roleMapping;

    @Autowired
    public LabFlowOidcUserService(LabFlowOidcRoleMappingProperties roleMapping) {
        this(new OidcUserService(), roleMapping);
    }

    LabFlowOidcUserService(
            OAuth2UserService<OidcUserRequest, OidcUser> delegate,
            LabFlowOidcRoleMappingProperties roleMapping
    ) {
        this.delegate = Objects.requireNonNull(delegate, "delegate must not be null");
        this.roleMapping = Objects.requireNonNull(roleMapping, "roleMapping must not be null");
    }

    public OidcUser loadUser(OidcUserRequest request) throws OAuth2AuthenticationException {
        OidcUser identity = delegate.loadUser(request);
        try {
            return LabFlowOidcUser.from(identity, roleMapping);
        } catch (IllegalArgumentException exception) {
            OAuth2Error error = new OAuth2Error(
                    INVALID_IDENTITY_ERROR,
                    "The identity provider did not supply the required LabFlow claims.",
                    null
            );
            throw new OAuth2AuthenticationException(error, exception);
        }
    }
}
