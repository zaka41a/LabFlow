package de.fhaachen.labflow.application;

import java.util.Objects;
import java.util.UUID;

public record AuthenticatedActor(
        UUID id,
        String username,
        String displayName,
        String labId,
        String role
) {

    public AuthenticatedActor {
        Objects.requireNonNull(id, "id must not be null");
        username = requireText(username, "username");
        displayName = requireText(displayName, "displayName");
        labId = requireText(labId, "labId");
        role = requireText(role, "role");
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }
}
