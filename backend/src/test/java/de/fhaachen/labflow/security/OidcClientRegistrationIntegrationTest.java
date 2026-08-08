package de.fhaachen.labflow.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.core.ClientAuthenticationMethod;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(properties = {
        "OIDC_CLIENT_ID=labflow-gitlab-test",
        "OIDC_CLIENT_SECRET=test-client-secret",
        "OIDC_CLIENT_AUTHENTICATION_METHOD=client_secret_basic",
        "OIDC_PUBLIC_ISSUER_URI=https://git-ce.rwth-aachen.de",
        "OIDC_AUTHORIZATION_URI=https://git-ce.rwth-aachen.de/oauth/authorize",
        "OIDC_TOKEN_URI=https://git-ce.rwth-aachen.de/oauth/token",
        "OIDC_JWK_SET_URI=https://git-ce.rwth-aachen.de/oauth/discovery/keys",
        "OIDC_USER_INFO_URI=https://git-ce.rwth-aachen.de/oauth/userinfo",
        "LABFLOW_OIDC_BORROWER_IDENTITIES=zaka41a",
        "LABFLOW_OIDC_MANAGER_IDENTITIES=SaadFihi,lsit-2026/roles/LabFlow/lab-manager",
        "LABFLOW_OIDC_TECHNICIAN_IDENTITIES=othmane022-jj"
})
@ActiveProfiles("oidc")
class OidcClientRegistrationIntegrationTest {

    @Autowired
    private ClientRegistrationRepository registrations;

    @Autowired
    private LabFlowOidcRoleMappingProperties roleMapping;

    @Test
    void configuresTheConfidentialRwthGitLabClient() {
        ClientRegistration registration = registrations.findByRegistrationId("labflow");

        assertThat(registration).isNotNull();
        assertThat(registration.getClientId()).isEqualTo("labflow-gitlab-test");
        assertThat(registration.getClientSecret()).isEqualTo("test-client-secret");
        assertThat(registration.getClientAuthenticationMethod())
                .isEqualTo(ClientAuthenticationMethod.CLIENT_SECRET_BASIC);
        assertThat(registration.getProviderDetails().getAuthorizationUri())
                .isEqualTo("https://git-ce.rwth-aachen.de/oauth/authorize");
        assertThat(registration.getProviderDetails().getTokenUri())
                .isEqualTo("https://git-ce.rwth-aachen.de/oauth/token");
        assertThat(registration.getProviderDetails().getJwkSetUri())
                .isEqualTo("https://git-ce.rwth-aachen.de/oauth/discovery/keys");
        assertThat(registration.getProviderDetails().getUserInfoEndpoint().getUri())
                .isEqualTo("https://git-ce.rwth-aachen.de/oauth/userinfo");
        assertThat(roleMapping.roleFor(java.util.Set.of("saadfihi")))
                .isEqualTo(LabFlowRole.LAB_MANAGER);
        assertThat(roleMapping.roleFor(
                java.util.Set.of("lsit-2026/roles/labflow/lab-manager")
        )).isEqualTo(LabFlowRole.LAB_MANAGER);
    }
}
