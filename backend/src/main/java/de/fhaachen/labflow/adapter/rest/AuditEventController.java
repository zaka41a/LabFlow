package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.LoanRequestService;
import de.fhaachen.labflow.domain.AuditEvent;
import de.fhaachen.labflow.security.LabFlowPrincipal;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/audit-events")
public class AuditEventController {

    private final LoanRequestService service;

    public AuditEventController(LoanRequestService service) {
        this.service = service;
    }

    @GetMapping
    public List<AuditEvent> findAll(@AuthenticationPrincipal LabFlowPrincipal user) {
        return service.findAuditEvents(RestActorMapper.from(user));
    }
}
