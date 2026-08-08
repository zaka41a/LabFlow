package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.ConcurrencyConflictException;
import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentAccessPolicy;
import de.fhaachen.labflow.domain.EquipmentStatus;
import de.fhaachen.labflow.domain.EquipmentType;
import org.junit.jupiter.api.Test;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class InMemoryEquipmentRepositoryTest {

    @Test
    void rejectsAnUpdateBasedOnAStaleRevision() {
        InMemoryEquipmentRepository repository = new InMemoryEquipmentRepository();
        Equipment original = new Equipment(
                UUID.randomUUID(),
                "FH_AACHEN",
                "Fluke 117",
                EquipmentType.MEASURING_DEVICE,
                "MEA-117",
                EquipmentStatus.AVAILABLE,
                EquipmentAccessPolicy.OPEN,
                null,
                "/equipment/fluke-117-multimeter.webp",
                0
        );

        repository.save(original);
        Equipment reserved = repository.save(original.withStatus(EquipmentStatus.RESERVED));

        assertThat(reserved.revision()).isEqualTo(1);
        assertThatThrownBy(() -> repository.save(original.withStatus(EquipmentStatus.MAINTENANCE)))
                .isInstanceOf(ConcurrencyConflictException.class);
    }
}
