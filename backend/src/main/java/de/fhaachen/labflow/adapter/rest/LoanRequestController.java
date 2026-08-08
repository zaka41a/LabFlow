package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.LoanRequestService;
import de.fhaachen.labflow.security.LabFlowPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/loan-requests")
public class LoanRequestController {

    private final LoanRequestService service;

    public LoanRequestController(LoanRequestService service) {
        this.service = service;
    }

    @GetMapping
    public List<LoanRequestResponse> findMine(
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return service.findForBorrower(RestActorMapper.from(user)).stream()
                .map(LoanRequestResponse::from)
                .toList();
    }

    @GetMapping("/{requestId}")
    public LoanRequestResponse findOne(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return LoanRequestResponse.from(service.findForBorrower(
                requestId,
                RestActorMapper.from(user)
        ));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LoanRequestResponse create(
            @Valid @RequestBody CreateLoanRequest command,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return LoanRequestResponse.from(service.createDraft(
                command.equipmentId(),
                command.purpose(),
                command.qualificationEvidence(),
                command.requestedFrom(),
                command.requestedUntil(),
                RestActorMapper.from(user)
        ));
    }

    @PostMapping("/{requestId}/submit")
    public LoanRequestResponse submit(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return LoanRequestResponse.from(service.submit(requestId, RestActorMapper.from(user)));
    }

    @PostMapping("/{requestId}/cancel")
    public LoanRequestResponse cancel(
            @PathVariable UUID requestId,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return LoanRequestResponse.from(service.cancel(requestId, RestActorMapper.from(user)));
    }

    public record CreateLoanRequest(
            @NotNull UUID equipmentId,
            @NotBlank @Size(max = 500) String purpose,
            @Size(max = 500) String qualificationEvidence,
            @NotNull LocalDate requestedFrom,
            @NotNull LocalDate requestedUntil
    ) {
    }
}
