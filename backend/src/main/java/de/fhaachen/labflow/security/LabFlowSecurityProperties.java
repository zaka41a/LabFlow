package de.fhaachen.labflow.security;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

import java.util.List;
import java.util.UUID;

@Validated
@ConfigurationProperties("labflow.security")
public record LabFlowSecurityProperties(
        @NotEmpty List<@Valid UserAccount> users
) {
    public LabFlowSecurityProperties {
        users = List.copyOf(users);
    }

    public record UserAccount(
            @NotNull UUID id,
            @NotBlank String username,
            @NotBlank String passwordHash,
            @NotBlank String displayName,
            @NotBlank String labId,
            @NotBlank String labName,
            @NotNull LabFlowRole role
    ) {
    }
}
