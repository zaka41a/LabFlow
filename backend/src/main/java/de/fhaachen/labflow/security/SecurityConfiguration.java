package de.fhaachen.labflow.security;

import jakarta.servlet.DispatcherType;
import de.fhaachen.labflow.web.ApiProblemWriter;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.beans.factory.ObjectProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.client.registration.ClientRegistrationRepository;
import org.springframework.security.oauth2.client.oidc.web.logout.OidcClientInitiatedLogoutSuccessHandler;
import org.springframework.security.oauth2.core.oidc.user.OidcUser;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.logout.LogoutSuccessHandler;

import java.util.Locale;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Configuration(proxyBeanMethods = false)
@EnableMethodSecurity
@EnableConfigurationProperties(LabFlowSecurityProperties.class)
public class SecurityConfiguration {

    private static final Logger LOGGER = LoggerFactory.getLogger(SecurityConfiguration.class);

    @Bean
    PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }

    @Bean
    UserDetailsService userDetailsService(LabFlowSecurityProperties properties) {
        Map<String, LabFlowSecurityProperties.UserAccount> accounts = properties.users().stream()
                .collect(Collectors.toUnmodifiableMap(
                        account -> normalizeUsername(account.username()),
                        Function.identity(),
                        (first, duplicate) -> {
                            throw new IllegalStateException(
                                    "Duplicate LabFlow username: " + duplicate.username()
                            );
                        }
                ));

        return username -> {
            LabFlowSecurityProperties.UserAccount account = accounts.get(normalizeUsername(username));
            if (account == null) {
                throw new UsernameNotFoundException("Unknown LabFlow user");
            }
            return new LabFlowUserDetails(account);
        };
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http,
            ObjectProvider<ClientRegistrationRepository> registrations,
            LabFlowOidcUserService oidcUserService,
            ApiProblemWriter problemWriter
    ) throws Exception {
        ClientRegistrationRepository registrationRepository = registrations.getIfAvailable();
        LogoutSuccessHandler logoutSuccessHandler = logoutSuccessHandler(registrationRepository);

        http
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(authorize -> authorize
                        .dispatcherTypeMatchers(DispatcherType.ERROR).permitAll()
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers(
                                "/api/auth/csrf",
                                "/api/auth/login",
                                "/api/auth/config",
                                "/oauth2/**",
                                "/login/oauth2/**"
                        ).permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/equipment")
                        .hasRole(LabFlowRole.TECHNICIAN.name())
                        .requestMatchers("/api/approvals/**").hasRole(LabFlowRole.LAB_MANAGER.name())
                        .requestMatchers("/api/handover/**").hasRole(LabFlowRole.TECHNICIAN.name())
                        .requestMatchers("/api/audit-events/**").hasAnyRole(
                                LabFlowRole.LAB_MANAGER.name(),
                                LabFlowRole.TECHNICIAN.name()
                        )
                        .requestMatchers("/api/loan-requests/**").hasRole(LabFlowRole.BORROWER.name())
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .formLogin(form -> form
                        .loginProcessingUrl("/api/auth/login")
                        .usernameParameter("username")
                        .passwordParameter("password")
                        .successHandler((request, response, authentication) ->
                                response.setStatus(204))
                        .failureHandler((request, response, exception) ->
                                problemWriter.write(
                                        request,
                                        response,
                                        401,
                                        "AUTHENTICATION_FAILED",
                                        "Anmeldung fehlgeschlagen"
                                ))
                        .permitAll()
                )
                .logout(logout -> logout
                        .logoutUrl("/api/auth/logout")
                        .clearAuthentication(true)
                        .invalidateHttpSession(true)
                        .deleteCookies("LABFLOW_SESSION")
                        .logoutSuccessHandler(logoutSuccessHandler)
                )
                .sessionManagement(session -> session
                        .sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)
                        .sessionFixation(fixation -> fixation.migrateSession())
                )
                .requestCache(AbstractHttpConfigurer::disable)
                .httpBasic(AbstractHttpConfigurer::disable)
                .exceptionHandling(exceptions -> exceptions
                        .authenticationEntryPoint((request, response, exception) ->
                                problemWriter.write(
                                        request,
                                        response,
                                        401,
                                        "AUTHENTICATION_REQUIRED",
                                        "Authentifizierung erforderlich"
                                ))
                        .accessDeniedHandler((request, response, exception) ->
                                problemWriter.write(
                                        request,
                                        response,
                                        403,
                                        "ACCESS_DENIED",
                                        "Zugriff verweigert"
                                ))
                );

        if (registrationRepository != null) {
            http.oauth2Login(oauth -> oauth
                    .userInfoEndpoint(userInfo -> userInfo
                            .oidcUserService(oidcUserService::loadUser))
                    .defaultSuccessUrl("/", true)
                    .failureHandler((request, response, exception) -> {
                        LOGGER.warn("OpenID Connect login failed", exception);
                        response.sendRedirect("/?login=oidc_error");
                    })
            );
        }

        return http.build();
    }

    LogoutSuccessHandler logoutSuccessHandler(
            ClientRegistrationRepository registrationRepository
    ) {
        if (registrationRepository == null) {
            return (request, response, authentication) -> response.sendRedirect("/");
        }

        OidcClientInitiatedLogoutSuccessHandler oidcHandler =
                new OidcClientInitiatedLogoutSuccessHandler(registrationRepository);
        oidcHandler.setPostLogoutRedirectUri("{baseUrl}/");

        return (request, response, authentication) -> {
            if (authentication != null && authentication.getPrincipal() instanceof OidcUser) {
                oidcHandler.onLogoutSuccess(request, response, authentication);
                return;
            }
            response.sendRedirect("/");
        };
    }

    private static String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
