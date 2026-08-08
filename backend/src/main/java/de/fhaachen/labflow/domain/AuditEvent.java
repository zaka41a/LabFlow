package de.fhaachen.labflow.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record AuditEvent(
        UUID id,
        String labId,
        UUID loanRequestId,
        AuditAction action,
        UUID actorId,
        String actorName,
        String actorRole,
        String details,
        Instant occurredAt
) {

    public AuditEvent {
        Objects.requireNonNull(id, "id must not be null");
        labId = requireText(labId, "labId");
        Objects.requireNonNull(loanRequestId, "loanRequestId must not be null");
        Objects.requireNonNull(action, "action must not be null");
        Objects.requireNonNull(actorId, "actorId must not be null");
        actorName = requireText(actorName, "actorName");
        actorRole = actorRole == null || actorRole.isBlank() ? "UNKNOWN" : actorRole.trim();
        details = details == null || details.isBlank()
                ? "Prozessschritt dokumentiert"
                : details.trim();
        Objects.requireNonNull(occurredAt, "occurredAt must not be null");
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }
}
