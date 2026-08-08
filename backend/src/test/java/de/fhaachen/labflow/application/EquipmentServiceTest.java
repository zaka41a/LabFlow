package de.fhaachen.labflow.application;

import de.fhaachen.labflow.adapter.storage.InMemoryEquipmentImageRepository;
import de.fhaachen.labflow.adapter.storage.InMemoryEquipmentRepository;
import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentAccessPolicy;
import de.fhaachen.labflow.domain.EquipmentStatus;
import de.fhaachen.labflow.domain.EquipmentType;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class EquipmentServiceTest {

    private InMemoryEquipmentRepository equipment;
    private InMemoryEquipmentImageRepository images;
    private EquipmentService service;

    @BeforeEach
    void setUp() {
        equipment = new InMemoryEquipmentRepository();
        images = new InMemoryEquipmentImageRepository();
        service = new EquipmentService(equipment, images);
    }

    @Test
    void technicianCreatesAnAvailableEquipmentItemInTheirOwnLaboratory() {
        Equipment created = service.create(command("BIO-2026-099"), technician());

        assertThat(created.labId()).isEqualTo("FH_AACHEN");
        assertThat(created.status()).isEqualTo(EquipmentStatus.AVAILABLE);
        assertThat(created.imageUrl()).isEqualTo("/api/equipment/" + created.id() + "/image");
        assertThat(equipment.findById(created.id())).contains(created);
        assertThat(service.findImage(created.id(), technician()).contentType()).isEqualTo("image/png");
    }

    @Test
    void borrowerCannotCreateEquipmentEvenWhenCallingTheServiceDirectly() {
        AuthenticatedActor borrower = new AuthenticatedActor(
                UUID.randomUUID(),
                "borrower@labflow.local",
                "Borrower",
                "FH_AACHEN",
                "BORROWER"
        );

        assertThatThrownBy(() -> service.create(command("BIO-2026-100"), borrower))
                .isInstanceOf(AccessViolationException.class);
        assertThat(equipment.findAll()).isEmpty();
    }

    @Test
    void duplicateInventoryNumbersAreRejectedWithinTheSameLaboratory() {
        service.create(command("BIO-2026-101"), technician());

        assertThatThrownBy(() -> service.create(command("bio-2026-101"), technician()))
                .isInstanceOf(ConcurrencyConflictException.class)
                .hasMessageContaining("inventory number");
        assertThat(equipment.findAll()).hasSize(1);
    }

    @Test
    void imageAccessIsRestrictedToTheAuthenticatedLaboratory() {
        Equipment created = service.create(command("BIO-2026-102"), technician());
        AuthenticatedActor otherLab = new AuthenticatedActor(
                UUID.randomUUID(),
                "technician@other.example",
                "Other Technician",
                "OTHER_LAB",
                "TECHNICIAN"
        );

        assertThatThrownBy(() -> service.findImage(created.id(), otherLab))
                .isInstanceOf(AccessViolationException.class);
    }

    private static CreateEquipmentCommand command(String serialNumber) {
        return new CreateEquipmentCommand(
                "Neue Laborwaage",
                EquipmentType.LABORATORY_DEVICE,
                serialNumber,
                EquipmentAccessPolicy.QUALIFICATION_REQUIRED,
                "Einweisung in die Laborwaage",
                new EquipmentImage(EquipmentImageTest.png(), "image/png")
        );
    }

    private static AuthenticatedActor technician() {
        return new AuthenticatedActor(
                UUID.fromString("10000000-0000-0000-0000-000000000003"),
                "technician@labflow.local",
                "Othmane Tayani",
                "FH_AACHEN",
                "TECHNICIAN"
        );
    }
}
