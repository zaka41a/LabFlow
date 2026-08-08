package de.fhaachen.labflow.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record AccessVerification(
        UUID verifiedBy,
        String verifiedByName,
        Instant verifiedAt
) {

    public AccessVerification {
        Objects.requireNonNull(verifiedBy, "verifiedBy must not be null");
        if (verifiedByName == null || verifiedByName.isBlank()) {
            throw new IllegalArgumentException("verifiedByName must not be blank");
        }
        verifiedByName = verifiedByName.trim();
        Objects.requireNonNull(verifiedAt, "verifiedAt must not be null");
    }
}
