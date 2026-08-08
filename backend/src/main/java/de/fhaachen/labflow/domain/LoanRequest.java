package de.fhaachen.labflow.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public record LoanRequest(
        UUID id,
        String reference,
        UUID equipmentId,
        UUID borrowerId,
        String borrowerName,
        String labId,
        String purpose,
        LoanStatus status,
        LocalDate requestedFrom,
        LocalDate requestedUntil,
        LocalDate dueDate,
        String rejectionReason,
        String qualificationEvidence,
        AccessVerification accessVerification,
        Instant submittedAt,
        Instant createdAt,
        Instant updatedAt,
        long revision
) implements VersionedDocument {

    public LoanRequest {
        Objects.requireNonNull(id, "id must not be null");
        reference = requireText(reference, "reference");
        Objects.requireNonNull(equipmentId, "equipmentId must not be null");
        Objects.requireNonNull(borrowerId, "borrowerId must not be null");
        borrowerName = requireText(borrowerName, "borrowerName");
        labId = requireText(labId, "labId");
        purpose = requireText(purpose, "purpose");
        Objects.requireNonNull(status, "status must not be null");
        Objects.requireNonNull(requestedFrom, "requestedFrom must not be null");
        Objects.requireNonNull(requestedUntil, "requestedUntil must not be null");
        Objects.requireNonNull(createdAt, "createdAt must not be null");
        Objects.requireNonNull(updatedAt, "updatedAt must not be null");
        if (revision < 0) {
            throw new IllegalArgumentException("revision must not be negative");
        }

        if (requestedUntil.isBefore(requestedFrom)) {
            throw new IllegalArgumentException("requestedUntil must not be before requestedFrom");
        }
        if (dueDate != null && (dueDate.isBefore(requestedFrom) || dueDate.isAfter(requestedUntil))) {
            throw new IllegalArgumentException("dueDate must be within the requested period");
        }
        if (rejectionReason != null) {
            rejectionReason = requireText(rejectionReason, "rejectionReason");
        }
        qualificationEvidence = optionalText(qualificationEvidence);
    }

    public static LoanRequest draft(
            UUID id,
            String reference,
            UUID equipmentId,
            UUID borrowerId,
            String borrowerName,
            String labId,
            String purpose,
            String qualificationEvidence,
            LocalDate requestedFrom,
            LocalDate requestedUntil,
            Instant now
    ) {
        return new LoanRequest(
                id,
                reference,
                equipmentId,
                borrowerId,
                borrowerName,
                labId,
                purpose,
                LoanStatus.DRAFT,
                requestedFrom,
                requestedUntil,
                null,
                null,
                qualificationEvidence,
                null,
                null,
                now,
                now,
                0
        );
    }

    public LoanRequest submit(Instant now) {
        requireStatus(LoanStatus.DRAFT, "submit");
        return copy(LoanStatus.SUBMITTED, null, null, accessVerification, now, now);
    }

    public LoanRequest approve(
            LocalDate approvedDueDate,
            AccessVerification verification,
            Instant now
    ) {
        requireStatus(LoanStatus.SUBMITTED, "approve");
        Objects.requireNonNull(approvedDueDate, "approvedDueDate must not be null");
        if (approvedDueDate.isBefore(requestedFrom) || approvedDueDate.isAfter(requestedUntil)) {
            throw new DomainException("Due date must be within the requested period");
        }
        return copy(
                LoanStatus.APPROVED,
                approvedDueDate,
                null,
                verification,
                submittedAt,
                now
        );
    }

    public LoanRequest reject(String reason, Instant now) {
        requireStatus(LoanStatus.SUBMITTED, "reject");
        return copy(
                LoanStatus.REJECTED,
                null,
                requireText(reason, "reason"),
                accessVerification,
                submittedAt,
                now
        );
    }

    public LoanRequest cancel(Instant now) {
        if (status != LoanStatus.DRAFT
                && status != LoanStatus.SUBMITTED
                && status != LoanStatus.APPROVED) {
            throw new DomainException("Cannot cancel loan request in status " + status);
        }
        return copy(
                LoanStatus.CANCELLED,
                dueDate,
                null,
                accessVerification,
                submittedAt,
                now
        );
    }

    public LoanRequest checkout(Instant now) {
        requireStatus(LoanStatus.APPROVED, "checkout");
        return copy(
                LoanStatus.CHECKED_OUT,
                dueDate,
                null,
                accessVerification,
                submittedAt,
                now
        );
    }

    public LoanRequest returnEquipment(Instant now) {
        requireStatus(LoanStatus.CHECKED_OUT, "return");
        return copy(
                LoanStatus.RETURNED,
                dueDate,
                null,
                accessVerification,
                submittedAt,
                now
        );
    }

    private LoanRequest copy(
            LoanStatus newStatus,
            LocalDate newDueDate,
            String newRejectionReason,
            AccessVerification newAccessVerification,
            Instant newSubmittedAt,
            Instant now
    ) {
        Objects.requireNonNull(now, "now must not be null");
        return new LoanRequest(
                id,
                reference,
                equipmentId,
                borrowerId,
                borrowerName,
                labId,
                purpose,
                newStatus,
                requestedFrom,
                requestedUntil,
                newDueDate,
                newRejectionReason,
                qualificationEvidence,
                newAccessVerification,
                newSubmittedAt,
                createdAt,
                now,
                revision + 1
        );
    }

    private void requireStatus(LoanStatus expected, String action) {
        if (status != expected) {
            throw new DomainException("Cannot " + action + " loan request in status " + status);
        }
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    private static String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
