package de.fhaachen.labflow.domain;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Objects;
import java.util.UUID;

public record LoanRequest(
        UUID id,
        UUID equipmentId,
        String borrowerSubject,
        String labId,
        LoanStatus status,
        LocalDate requestedFrom,
        LocalDate requestedUntil,
        LocalDate dueDate,
        String rejectionReason,
        Instant createdAt,
        Instant updatedAt
) {

    public LoanRequest {
        Objects.requireNonNull(id, "id must not be null");
        Objects.requireNonNull(equipmentId, "equipmentId must not be null");
        borrowerSubject = requireText(borrowerSubject, "borrowerSubject");
        labId = requireText(labId, "labId");
        Objects.requireNonNull(status, "status must not be null");
        Objects.requireNonNull(requestedFrom, "requestedFrom must not be null");
        Objects.requireNonNull(requestedUntil, "requestedUntil must not be null");
        Objects.requireNonNull(createdAt, "createdAt must not be null");
        Objects.requireNonNull(updatedAt, "updatedAt must not be null");

        if (requestedUntil.isBefore(requestedFrom)) {
            throw new IllegalArgumentException("requestedUntil must not be before requestedFrom");
        }
    }

    public static LoanRequest draft(
            UUID id,
            UUID equipmentId,
            String borrowerSubject,
            String labId,
            LocalDate requestedFrom,
            LocalDate requestedUntil,
            Instant now
    ) {
        return new LoanRequest(
                id,
                equipmentId,
                borrowerSubject,
                labId,
                LoanStatus.DRAFT,
                requestedFrom,
                requestedUntil,
                null,
                null,
                now,
                now
        );
    }

    public LoanRequest submit(Instant now) {
        requireStatus(LoanStatus.DRAFT, "submit");
        return copy(LoanStatus.SUBMITTED, dueDate, rejectionReason, now);
    }

    public LoanRequest approve(LocalDate approvedDueDate, Instant now) {
        requireStatus(LoanStatus.SUBMITTED, "approve");
        Objects.requireNonNull(approvedDueDate, "approvedDueDate must not be null");
        if (approvedDueDate.isBefore(requestedFrom)) {
            throw new DomainException("Due date must not be before the requested start date");
        }
        return copy(LoanStatus.APPROVED, approvedDueDate, null, now);
    }

    public LoanRequest reject(String reason, Instant now) {
        requireStatus(LoanStatus.SUBMITTED, "reject");
        return copy(LoanStatus.REJECTED, null, requireText(reason, "reason"), now);
    }

    public LoanRequest cancel(Instant now) {
        if (status != LoanStatus.DRAFT
                && status != LoanStatus.SUBMITTED
                && status != LoanStatus.APPROVED) {
            throw new DomainException("Cannot cancel loan request in status " + status);
        }
        return copy(LoanStatus.CANCELLED, dueDate, rejectionReason, now);
    }

    public LoanRequest checkout(Instant now) {
        requireStatus(LoanStatus.APPROVED, "checkout");
        return copy(LoanStatus.CHECKED_OUT, dueDate, null, now);
    }

    public LoanRequest returnEquipment(Instant now) {
        requireStatus(LoanStatus.CHECKED_OUT, "return");
        return copy(LoanStatus.RETURNED, dueDate, null, now);
    }

    private LoanRequest copy(
            LoanStatus newStatus,
            LocalDate newDueDate,
            String newRejectionReason,
            Instant now
    ) {
        Objects.requireNonNull(now, "now must not be null");
        return new LoanRequest(
                id,
                equipmentId,
                borrowerSubject,
                labId,
                newStatus,
                requestedFrom,
                requestedUntil,
                newDueDate,
                newRejectionReason,
                createdAt,
                now
        );
    }

    private void requireStatus(LoanStatus expected, String action) {
        if (status != expected) {
            throw new DomainException(
                    "Cannot " + action + " loan request in status " + status
            );
        }
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }
}
