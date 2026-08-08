package de.fhaachen.labflow.application;

import de.fhaachen.labflow.adapter.storage.InMemoryAuditEventRepository;
import de.fhaachen.labflow.adapter.storage.InMemoryCheckoutRecordRepository;
import de.fhaachen.labflow.adapter.storage.InMemoryEquipmentRepository;
import de.fhaachen.labflow.adapter.storage.InMemoryLoanRequestRepository;
import de.fhaachen.labflow.domain.DomainException;
import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentAccessPolicy;
import de.fhaachen.labflow.domain.EquipmentCondition;
import de.fhaachen.labflow.domain.EquipmentStatus;
import de.fhaachen.labflow.domain.EquipmentType;
import de.fhaachen.labflow.domain.LoanStatus;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class LoanRequestServiceTest {

    private static final UUID EQUIPMENT_ID = UUID.fromString(
            "20000000-0000-0000-0000-000000000001"
    );
    private static final AuthenticatedActor BORROWER = new AuthenticatedActor(
            UUID.fromString("10000000-0000-0000-0000-000000000001"),
            "borrower@labflow.local",
            "Zakaria Sabiri",
            "FH_AACHEN",
            "BORROWER"
    );
    private static final AuthenticatedActor MANAGER = new AuthenticatedActor(
            UUID.fromString("10000000-0000-0000-0000-000000000002"),
            "manager@labflow.local",
            "Fihi Saad",
            "FH_AACHEN",
            "LAB_MANAGER"
    );
    private static final AuthenticatedActor TECHNICIAN = new AuthenticatedActor(
            UUID.fromString("10000000-0000-0000-0000-000000000003"),
            "technician@labflow.local",
            "Othmane Tayani",
            "FH_AACHEN",
            "TECHNICIAN"
    );

    private InMemoryEquipmentRepository equipment;
    private InMemoryAuditEventRepository auditEvents;
    private LoanRequestService service;

    @BeforeEach
    void setUp() {
        equipment = new InMemoryEquipmentRepository();
        auditEvents = new InMemoryAuditEventRepository();
        service = new LoanRequestService(
                new InMemoryLoanRequestRepository(),
                equipment,
                new InMemoryCheckoutRecordRepository(),
                auditEvents,
                Clock.fixed(Instant.parse("2026-08-07T08:00:00Z"), ZoneOffset.UTC)
        );
        equipment.save(new Equipment(
                EQUIPMENT_ID,
                "FH_AACHEN",
                "Dell Precision 5680",
                EquipmentType.LAPTOP,
                "LAP-2026-014",
                EquipmentStatus.AVAILABLE,
                EquipmentAccessPolicy.OPEN,
                null,
                "/equipment/dell-precision-5680.webp",
                0
        ));
    }

    @Test
    void executesTheCompleteWorkflowAndUpdatesTheEquipment() {
        LoanRequestDetails draft = service.createDraft(
                EQUIPMENT_ID,
                "Auswertung einer Messreihe",
                null,
                LocalDate.parse("2026-08-10"),
                LocalDate.parse("2026-08-14"),
                BORROWER
        );

        LoanRequestDetails submitted = service.submit(draft.request().id(), BORROWER);
        LoanRequestDetails approved = service.approve(
                draft.request().id(),
                LocalDate.parse("2026-08-14"),
                false,
                MANAGER
        );
        LoanRequestDetails checkedOut = service.checkout(
                draft.request().id(),
                EquipmentCondition.FAULTLESS,
                null,
                TECHNICIAN
        );
        LoanRequestDetails returned = service.returnEquipment(
                draft.request().id(),
                EquipmentCondition.MINOR_WEAR,
                "Leichte Kratzer am Gehäuse",
                TECHNICIAN
        );

        assertThat(submitted.request().status()).isEqualTo(LoanStatus.SUBMITTED);
        assertThat(approved.equipment().status()).isEqualTo(EquipmentStatus.RESERVED);
        assertThat(checkedOut.equipment().status()).isEqualTo(EquipmentStatus.CHECKED_OUT);
        assertThat(returned.request().status()).isEqualTo(LoanStatus.RETURNED);
        assertThat(returned.equipment().status()).isEqualTo(EquipmentStatus.AVAILABLE);
        assertThat(auditEvents.findAll()).hasSize(5);
        assertThat(auditEvents.findAll())
                .extracting(event -> event.actorRole())
                .contains("BORROWER", "LAB_MANAGER", "TECHNICIAN");
    }

    @Test
    void movesEquipmentToMaintenanceWhenTheReturnRequiresReview() {
        LoanRequestDetails draft = service.createDraft(
                EQUIPMENT_ID,
                "Prüfung unter Laborbedingungen",
                null,
                LocalDate.parse("2026-08-10"),
                LocalDate.parse("2026-08-14"),
                BORROWER
        );
        service.submit(draft.request().id(), BORROWER);
        service.approve(
                draft.request().id(),
                LocalDate.parse("2026-08-14"),
                false,
                MANAGER
        );
        service.checkout(
                draft.request().id(),
                EquipmentCondition.FAULTLESS,
                null,
                TECHNICIAN
        );

        LoanRequestDetails returned = service.returnEquipment(
                draft.request().id(),
                EquipmentCondition.REVIEW_REQUIRED,
                "Sicherheitsprüfung erforderlich",
                TECHNICIAN
        );

        assertThat(returned.equipment().status()).isEqualTo(EquipmentStatus.MAINTENANCE);
    }

    @Test
    void preventsAnotherBorrowerFromChangingTheRequest() {
        LoanRequestDetails draft = service.createDraft(
                EQUIPMENT_ID,
                "Auswertung einer Messreihe",
                null,
                LocalDate.parse("2026-08-10"),
                LocalDate.parse("2026-08-14"),
                BORROWER
        );
        AuthenticatedActor otherBorrower = new AuthenticatedActor(
                UUID.randomUUID(),
                "other@labflow.local",
                "Other Borrower",
                "FH_AACHEN",
                "BORROWER"
        );

        assertThatThrownBy(() -> service.submit(draft.request().id(), otherBorrower))
                .isInstanceOf(AccessViolationException.class);
    }

    @Test
    void requiresAndAuditsQualificationVerificationForRestrictedEquipment() {
        UUID centrifugeId = UUID.fromString("20000000-0000-0000-0000-000000000009");
        equipment.save(new Equipment(
                centrifugeId,
                "FH_AACHEN",
                "Laborzentrifuge 12 × 15 ml",
                EquipmentType.LABORATORY_DEVICE,
                "BIO-2026-012",
                EquipmentStatus.AVAILABLE,
                EquipmentAccessPolicy.QUALIFICATION_REQUIRED,
                "Zentrifugenunterweisung und Freigabe der Laborleitung",
                "/equipment/laboratory-centrifuge.webp",
                0
        ));

        assertThatThrownBy(() -> service.createDraft(
                centrifugeId,
                "Aufbereitung von Laborproben",
                null,
                LocalDate.parse("2026-08-10"),
                LocalDate.parse("2026-08-14"),
                BORROWER
        )).isInstanceOf(DomainException.class);

        LoanRequestDetails draft = service.createDraft(
                centrifugeId,
                "Aufbereitung von Laborproben",
                "Zentrifugenunterweisung am 03.08.2026 bei Dr. Muster absolviert",
                LocalDate.parse("2026-08-10"),
                LocalDate.parse("2026-08-14"),
                BORROWER
        );
        service.submit(draft.request().id(), BORROWER);

        assertThatThrownBy(() -> service.approve(
                draft.request().id(),
                LocalDate.parse("2026-08-14"),
                false,
                MANAGER
        )).isInstanceOf(DomainException.class);

        LoanRequestDetails approved = service.approve(
                draft.request().id(),
                LocalDate.parse("2026-08-14"),
                true,
                MANAGER
        );

        assertThat(approved.request().accessVerification()).isNotNull();
        assertThat(approved.request().accessVerification().verifiedBy()).isEqualTo(MANAGER.id());
        assertThat(approved.request().accessVerification().verifiedByName())
                .isEqualTo(MANAGER.displayName());
        assertThat(auditEvents.findAll())
                .filteredOn(event -> event.loanRequestId().equals(draft.request().id()))
                .extracting(event -> event.details())
                .anyMatch(details -> details.contains("Zugangsvoraussetzung geprüft"));
    }
}
