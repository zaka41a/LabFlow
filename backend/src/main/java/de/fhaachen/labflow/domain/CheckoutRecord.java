package de.fhaachen.labflow.domain;

import java.time.Instant;
import java.util.Objects;
import java.util.UUID;

public record CheckoutRecord(
        UUID id,
        UUID loanRequestId,
        String labId,
        UUID checkedOutBy,
        String checkedOutByName,
        EquipmentCondition checkoutCondition,
        String checkoutNotes,
        Instant checkedOutAt,
        UUID returnedBy,
        String returnedByName,
        EquipmentCondition returnCondition,
        String returnNotes,
        Instant returnedAt,
        long revision
) implements VersionedDocument {

    public CheckoutRecord {
        Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(loanRequestId, "loanRequestId must not be null");
        labId = requireText(labId, "labId");
        Objects.requireNonNull(checkedOutBy, "checkedOutBy must not be null");
        checkedOutByName = requireText(checkedOutByName, "checkedOutByName");
        Objects.requireNonNull(checkoutCondition, "checkoutCondition must not be null");
        checkoutNotes = normalizeNotes(checkoutNotes);
        Objects.requireNonNull(checkedOutAt, "checkedOutAt must not be null");
        returnNotes = normalizeNotes(returnNotes);
        if (revision < 0) {
            throw new IllegalArgumentException("revision must not be negative");
        }

        boolean hasReturn = returnedAt != null;
        if (hasReturn != (returnedBy != null && returnedByName != null && returnCondition != null)) {
            throw new IllegalArgumentException("Return data must be provided completely");
        }
        if (returnedByName != null) {
            returnedByName = requireText(returnedByName, "returnedByName");
        }
    }

    public static CheckoutRecord checkout(
            UUID id,
            UUID loanRequestId,
            String labId,
            UUID technicianId,
            String technicianName,
            EquipmentCondition condition,
            String notes,
            Instant now
    ) {
        return new CheckoutRecord(
                id,
                loanRequestId,
                labId,
                technicianId,
                technicianName,
                condition,
                notes,
                now,
                null,
                null,
                null,
                null,
                null,
                0
        );
    }

    public CheckoutRecord completeReturn(
            UUID technicianId,
            String technicianName,
            EquipmentCondition condition,
            String notes,
            Instant now
    ) {
        if (returnedAt != null) {
            throw new DomainException("Equipment return has already been recorded");
        }
        return new CheckoutRecord(
                id,
                loanRequestId,
                labId,
                checkedOutBy,
                checkedOutByName,
                checkoutCondition,
                checkoutNotes,
                checkedOutAt,
                technicianId,
                technicianName,
                condition,
                notes,
                now,
                revision + 1
        );
    }

    private static String normalizeNotes(String notes) {
        return notes == null || notes.isBlank() ? null : notes.trim();
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }
}
