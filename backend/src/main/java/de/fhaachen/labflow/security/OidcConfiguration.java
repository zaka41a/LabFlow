package de.fhaachen.labflow.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.oauth2.client.oidc.authentication.OidcIdTokenDecoderFactory;
import org.springframework.security.oauth2.client.registration.ClientRegistration;
import org.springframework.security.oauth2.jwt.JwtDecoderFactory;
import org.springframework.security.oauth2.jwt.JwtValidators;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "labflow.security.oidc.enabled", havingValue = "true")
public class OidcConfiguration {

    @Bean
    JwtDecoderFactory<ClientRegistration> oidcIdTokenDecoderFactory(
            @Value("${labflow.security.oidc.expected-issuer}") String expectedIssuer
    ) {
        OidcIdTokenDecoderFactory factory = new OidcIdTokenDecoderFactory();
        factory.setJwtValidatorFactory(registration ->
                JwtValidators.createDefaultWithIssuer(expectedIssuer));
        return factory;
    }
}
