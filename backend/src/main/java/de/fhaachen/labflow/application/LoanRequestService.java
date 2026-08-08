package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.AuditAction;
import de.fhaachen.labflow.domain.AuditEvent;
import de.fhaachen.labflow.domain.AccessVerification;
import de.fhaachen.labflow.domain.CheckoutRecord;
import de.fhaachen.labflow.domain.DomainException;
import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentCondition;
import de.fhaachen.labflow.domain.EquipmentStatus;
import de.fhaachen.labflow.domain.LoanRequest;
import de.fhaachen.labflow.domain.LoanStatus;
import org.springframework.stereotype.Service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.Year;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.function.Predicate;
import java.util.stream.Collectors;

@Service
public class LoanRequestService {

    private final LoanRequestRepository loanRequests;
    private final EquipmentRepository equipment;
    private final CheckoutRecordRepository checkoutRecords;
    private final AuditEventRepository auditEvents;
    private final Clock clock;

    public LoanRequestService(
            LoanRequestRepository loanRequests,
            EquipmentRepository equipment,
            CheckoutRecordRepository checkoutRecords,
            AuditEventRepository auditEvents,
            Clock clock
    ) {
        this.loanRequests = loanRequests;
        this.equipment = equipment;
        this.checkoutRecords = checkoutRecords;
        this.auditEvents = auditEvents;
        this.clock = clock;
    }

    public List<LoanRequestDetails> findForBorrower(AuthenticatedActor actor) {
        return findAll(request -> request.labId().equals(actor.labId())
                && request.borrowerId().equals(actor.id()));
    }

    public LoanRequestDetails findForBorrower(UUID requestId, AuthenticatedActor actor) {
        return details(requireOwnedRequest(requestId, actor));
    }

    public List<LoanRequestDetails> findPendingApprovals(AuthenticatedActor actor) {
        return findAll(request -> request.labId().equals(actor.labId())
                && request.status() == LoanStatus.SUBMITTED);
    }

    public List<LoanRequestDetails> findPendingHandovers(AuthenticatedActor actor) {
        return findAll(request -> request.labId().equals(actor.labId())
                && (request.status() == LoanStatus.APPROVED
                || request.status() == LoanStatus.CHECKED_OUT));
    }

    public synchronized LoanRequestDetails createDraft(
            UUID equipmentId,
            String purpose,
            String qualificationEvidence,
            LocalDate requestedFrom,
            LocalDate requestedUntil,
            AuthenticatedActor actor
    ) {
        Equipment selectedEquipment = requireEquipment(equipmentId);
        requireLab(selectedEquipment.labId(), actor);
        if (!selectedEquipment.isAvailable()) {
            throw new DomainException("Equipment is not available");
        }
        if (selectedEquipment.requiresAccessVerification()
                && (qualificationEvidence == null
                || qualificationEvidence.trim().length() < 10)) {
            throw new DomainException(
                    "Für dieses Gerät muss eine Unterweisung oder Qualifikation angegeben werden"
            );
        }

        Instant now = clock.instant();
        UUID requestId = UUID.randomUUID();
        LoanRequest request = LoanRequest.draft(
                requestId,
                referenceFor(requestId),
                equipmentId,
                actor.id(),
                actor.displayName(),
                actor.labId(),
                purpose,
                qualificationEvidence,
                requestedFrom,
                requestedUntil,
                now
        );
        loanRequests.save(request);
        audit(request, AuditAction.REQUEST_CREATED, actor, now);
        return new LoanRequestDetails(request, selectedEquipment);
    }

    public synchronized LoanRequestDetails submit(UUID requestId, AuthenticatedActor actor) {
        LoanRequest request = requireOwnedRequest(requestId, actor);
        Instant now = clock.instant();
        LoanRequest submitted = request.submit(now);
        loanRequests.save(submitted);
        audit(submitted, AuditAction.REQUEST_SUBMITTED, actor, now);
        return details(submitted);
    }

    public synchronized LoanRequestDetails cancel(UUID requestId, AuthenticatedActor actor) {
        LoanRequest request = requireOwnedRequest(requestId, actor);
        Instant now = clock.instant();
        LoanRequest cancelled = request.cancel(now);
        loanRequests.save(cancelled);

        Equipment selectedEquipment = requireEquipment(request.equipmentId());
        if (request.status() == LoanStatus.APPROVED
                && selectedEquipment.status() == EquipmentStatus.RESERVED) {
            selectedEquipment = equipment.save(selectedEquipment.withStatus(EquipmentStatus.AVAILABLE));
        }

        audit(cancelled, AuditAction.REQUEST_CANCELLED, actor, now);
        return new LoanRequestDetails(cancelled, selectedEquipment);
    }

    public synchronized LoanRequestDetails approve(
            UUID requestId,
            LocalDate dueDate,
            boolean accessRequirementVerified,
            AuthenticatedActor actor
    ) {
        LoanRequest request = requireLabRequest(requestId, actor);
        Equipment selectedEquipment = requireEquipment(request.equipmentId());
        if (!selectedEquipment.isAvailable()) {
            throw new DomainException("Equipment is no longer available");
        }
        if (selectedEquipment.requiresAccessVerification() && !accessRequirementVerified) {
            throw new DomainException(
                    "Die erforderliche Unterweisung oder Qualifikation wurde nicht bestätigt"
            );
        }

        Instant now = clock.instant();
        AccessVerification verification = selectedEquipment.requiresAccessVerification()
                ? new AccessVerification(actor.id(), actor.displayName(), now)
                : null;
        LoanRequest approved = request.approve(dueDate, verification, now);
        loanRequests.save(approved);
        Equipment reserved = equipment.save(selectedEquipment.withStatus(EquipmentStatus.RESERVED));
        audit(approved, AuditAction.REQUEST_APPROVED, actor, now);
        return new LoanRequestDetails(approved, reserved);
    }

    public synchronized LoanRequestDetails reject(
            UUID requestId,
            String reason,
            AuthenticatedActor actor
    ) {
        LoanRequest request = requireLabRequest(requestId, actor);
        Instant now = clock.instant();
        LoanRequest rejected = request.reject(reason, now);
        loanRequests.save(rejected);
        audit(rejected, AuditAction.REQUEST_REJECTED, actor, now);
        return details(rejected);
    }

    public synchronized LoanRequestDetails checkout(
            UUID requestId,
            EquipmentCondition condition,
            String notes,
            AuthenticatedActor actor
    ) {
        LoanRequest request = requireLabRequest(requestId, actor);
        Equipment selectedEquipment = requireEquipment(request.equipmentId());
        if (selectedEquipment.status() != EquipmentStatus.RESERVED) {
            throw new DomainException("Equipment is not reserved for checkout");
        }
        if (checkoutRecords.findByLoanRequestId(requestId).isPresent()) {
            throw new DomainException("Checkout has already been recorded");
        }
        if (selectedEquipment.requiresAccessVerification()
                && request.accessVerification() == null) {
            throw new DomainException(
                    "Die Zugangsvoraussetzung wurde vor der Ausgabe nicht geprüft"
            );
        }

        Instant now = clock.instant();
        LoanRequest checkedOut = request.checkout(now);
        loanRequests.save(checkedOut);
        Equipment unavailable = equipment.save(selectedEquipment.withStatus(EquipmentStatus.CHECKED_OUT));
        checkoutRecords.save(CheckoutRecord.checkout(
                UUID.randomUUID(),
                requestId,
                request.labId(),
                actor.id(),
                actor.displayName(),
                condition,
                notes,
                now
        ));
        audit(checkedOut, AuditAction.EQUIPMENT_CHECKED_OUT, actor, now);
        return new LoanRequestDetails(checkedOut, unavailable);
    }

    public synchronized LoanRequestDetails returnEquipment(
            UUID requestId,
            EquipmentCondition condition,
            String notes,
            AuthenticatedActor actor
    ) {
        LoanRequest request = requireLabRequest(requestId, actor);
        Equipment selectedEquipment = requireEquipment(request.equipmentId());
        if (selectedEquipment.status() != EquipmentStatus.CHECKED_OUT) {
            throw new DomainException("Equipment is not checked out");
        }

        CheckoutRecord checkoutRecord = checkoutRecords.findByLoanRequestId(requestId)
                .orElseThrow(() -> new DomainException("Checkout record is missing"));
        Instant now = clock.instant();
        LoanRequest returned = request.returnEquipment(now);
        loanRequests.save(returned);
        EquipmentStatus resultingStatus = condition == EquipmentCondition.REVIEW_REQUIRED
                ? EquipmentStatus.MAINTENANCE
                : EquipmentStatus.AVAILABLE;
        Equipment available = equipment.save(selectedEquipment.withStatus(resultingStatus));
        checkoutRecords.save(checkoutRecord.completeReturn(
                actor.id(), actor.displayName(), condition, notes, now
        ));
        audit(returned, AuditAction.EQUIPMENT_RETURNED, actor, now);
        return new LoanRequestDetails(returned, available);
    }

    public List<AuditEvent> findAuditEvents(AuthenticatedActor actor) {
        return auditEvents.findAll().stream()
                .filter(event -> event.labId().equals(actor.labId()))
                .sorted(Comparator.comparing(AuditEvent::occurredAt).reversed())
                .toList();
    }

    private List<LoanRequestDetails> findAll(Predicate<LoanRequest> predicate) {
        Map<UUID, Equipment> equipmentById = equipment.findAll().stream()
                .collect(Collectors.toMap(Equipment::id, item -> item));

        return loanRequests.findAll().stream()
                .filter(predicate)
                .sorted(Comparator.comparing(LoanRequest::updatedAt).reversed())
                .map(request -> new LoanRequestDetails(
                        request,
                        requireEquipment(equipmentById, request.equipmentId())
                ))
                .toList();
    }

    private LoanRequest requireOwnedRequest(UUID requestId, AuthenticatedActor actor) {
        LoanRequest request = requireRequest(requestId);
        requireLab(request.labId(), actor);
        if (!request.borrowerId().equals(actor.id())) {
            throw new AccessViolationException("Loan request belongs to another borrower");
        }
        return request;
    }

    private LoanRequest requireLabRequest(UUID requestId, AuthenticatedActor actor) {
        LoanRequest request = requireRequest(requestId);
        requireLab(request.labId(), actor);
        return request;
    }

    private LoanRequest requireRequest(UUID requestId) {
        return loanRequests.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Loan request was not found"));
    }

    private Equipment requireEquipment(UUID equipmentId) {
        return equipment.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment was not found"));
    }

    private Equipment requireEquipment(Map<UUID, Equipment> equipmentById, UUID equipmentId) {
        Equipment item = equipmentById.get(equipmentId);
        if (item == null) {
            throw new ResourceNotFoundException("Equipment was not found");
        }
        return item;
    }

    private LoanRequestDetails details(LoanRequest request) {
        return new LoanRequestDetails(request, requireEquipment(request.equipmentId()));
    }

    private void requireLab(String labId, AuthenticatedActor actor) {
        if (!labId.equals(actor.labId())) {
            throw new AccessViolationException("Resource belongs to another laboratory");
        }
    }

    private String referenceFor(UUID requestId) {
        String suffix = requestId.toString().substring(0, 6).toUpperCase(Locale.ROOT);
        return "LF-" + Year.now(clock).getValue() + "-" + suffix;
    }

    private void audit(
            LoanRequest request,
            AuditAction action,
            AuthenticatedActor actor,
            Instant occurredAt
    ) {
        auditEvents.save(new AuditEvent(
                UUID.randomUUID(),
                request.labId(),
                request.id(),
                action,
                actor.id(),
                actor.displayName(),
                actor.role(),
                auditDetails(request),
                occurredAt
        ));
    }

    private String auditDetails(LoanRequest request) {
        String details = "Status: " + request.status().name();
        if (request.accessVerification() != null) {
            return details + "; Zugangsvoraussetzung geprüft durch "
                    + request.accessVerification().verifiedByName();
        }
        return details;
    }
}
