package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.LoanRequestDetails;
import de.fhaachen.labflow.domain.EquipmentAccessPolicy;
import de.fhaachen.labflow.domain.EquipmentType;
import de.fhaachen.labflow.domain.LoanRequest;
import de.fhaachen.labflow.domain.LoanStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record LoanRequestResponse(
        UUID id,
        String reference,
        UUID equipmentId,
        String equipmentName,
        String serialNumber,
        String imageUrl,
        EquipmentType equipmentType,
        EquipmentAccessPolicy accessPolicy,
        String requiredQualification,
        String borrowerName,
        String labId,
        String purpose,
        LoanStatus status,
        LocalDate requestedFrom,
        LocalDate requestedUntil,
        LocalDate dueDate,
        String rejectionReason,
        String qualificationEvidence,
        boolean accessRequirementVerified,
        String accessVerifiedByName,
        Instant accessVerifiedAt,
        Instant submittedAt,
        Instant updatedAt
) {

    public static LoanRequestResponse from(LoanRequestDetails details) {
        LoanRequest request = details.request();
        return new LoanRequestResponse(
                request.id(),
                request.reference(),
                request.equipmentId(),
                details.equipment().name(),
                details.equipment().serialNumber(),
                details.equipment().imageUrl(),
                details.equipment().type(),
                details.equipment().accessPolicy(),
                details.equipment().requiredQualification(),
                request.borrowerName(),
                request.labId(),
                request.purpose(),
                request.status(),
                request.requestedFrom(),
                request.requestedUntil(),
                request.dueDate(),
                request.rejectionReason(),
                request.qualificationEvidence(),
                request.accessVerification() != null,
                request.accessVerification() == null
                        ? null
                        : request.accessVerification().verifiedByName(),
                request.accessVerification() == null
                        ? null
                        : request.accessVerification().verifiedAt(),
                request.submittedAt(),
                request.updatedAt()
        );
    }
}
