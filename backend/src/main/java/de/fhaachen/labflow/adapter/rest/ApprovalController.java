package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.LoanRequestService;
import de.fhaachen.labflow.security.LabFlowPrincipal;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/approvals")
public class ApprovalController {

    private final LoanRequestService service;

    public ApprovalController(LoanRequestService service) {
        this.service = service;
    }

    @GetMapping("/pending")
    public List<LoanRequestResponse> findPending(
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return service.findPendingApprovals(RestActorMapper.from(user)).stream()
                .map(LoanRequestResponse::from)
                .toList();
    }

    @PostMapping("/{requestId}/approve")
    public LoanRequestResponse approve(
            @PathVariable UUID requestId,
            @Valid @RequestBody ApproveLoanRequest command,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return LoanRequestResponse.from(service.approve(
                requestId,
                command.dueDate(),
                command.accessRequirementVerified(),
                RestActorMapper.from(user)
        ));
    }

    @PostMapping("/{requestId}/reject")
    public LoanRequestResponse reject(
            @PathVariable UUID requestId,
            @Valid @RequestBody RejectLoanRequest command,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        return LoanRequestResponse.from(service.reject(
                requestId,
                command.reason(),
                RestActorMapper.from(user)
        ));
    }

    public record ApproveLoanRequest(
            @NotNull LocalDate dueDate,
            boolean accessRequirementVerified
    ) {
    }

    public record RejectLoanRequest(@NotBlank @Size(min = 10, max = 500) String reason) {
    }
}
