package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.LoanRequestDetails;
import de.fhaachen.labflow.application.LoanRequestService;
import de.fhaachen.labflow.domain.EquipmentCondition;
import de.fhaachen.labflow.domain.LoanStatus;
import de.fhaachen.labflow.security.LabFlowPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.ZoneId;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/handover")
public class HandoverController {

    private static final ZoneId LAB_ZONE = ZoneId.of("Europe/Berlin");

    private final LoanRequestService service;

    public HandoverController(LoanRequestService service) {
        this.service = service;
    }

    @GetMapping("/pending")
    public List<HandoverTaskResponse> findPending(
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return service.findPendingHandovers(RestActorMapper.from(user)).stream()
                .map(details -> HandoverTaskResponse.from(details, user.labName()))
                .toList();
    }

    @PostMapping("/{requestId}/checkout")
    public LoanRequestResponse checkout(
            @PathVariable UUID requestId,
            @Valid @RequestBody RecordCondition command,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return LoanRequestResponse.from(service.checkout(
                requestId,
                command.condition(),
                command.notes(),
                RestActorMapper.from(user)
        ));
    }

    @PostMapping("/{requestId}/return")
    public LoanRequestResponse returnEquipment(
            @PathVariable UUID requestId,
            @Valid @RequestBody RecordCondition command,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return LoanRequestResponse.from(service.returnEquipment(
                requestId,
                command.condition(),
                command.notes(),
                RestActorMapper.from(user)
        ));
    }

    public record RecordCondition(
            @NotNull EquipmentCondition condition,
            @Size(max = 1000) String notes
    ) {
    }

    public enum HandoverKind {
        CHECKOUT,
        RETURN
    }

    public record HandoverTaskResponse(
            UUID id,
            String requestReference,
            HandoverKind kind,
            String equipmentName,
            String serialNumber,
            String imageUrl,
            String borrowerName,
            String labId,
            Instant scheduledAt,
            String location
    ) {

        static HandoverTaskResponse from(LoanRequestDetails details, String labName) {
            boolean isCheckout = details.request().status() == LoanStatus.APPROVED;
            LocalDate scheduledDate = isCheckout
                    ? details.request().requestedFrom()
                    : details.request().dueDate();
            LocalTime scheduledTime = isCheckout ? LocalTime.of(9, 0) : LocalTime.of(14, 0);

            return new HandoverTaskResponse(
                    details.request().id(),
                    details.request().reference(),
                    isCheckout ? HandoverKind.CHECKOUT : HandoverKind.RETURN,
                    details.equipment().name(),
                    details.equipment().serialNumber(),
                    details.equipment().imageUrl(),
                    details.request().borrowerName(),
                    details.request().labId(),
                    scheduledDate.atTime(scheduledTime).atZone(LAB_ZONE).toInstant(),
                    labName + " · Ausgabestelle"
            );
        }
    }
}
