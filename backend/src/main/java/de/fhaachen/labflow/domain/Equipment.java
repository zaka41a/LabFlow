package de.fhaachen.labflow.domain;

import java.util.Objects;
import java.util.UUID;

public record Equipment(
        UUID id,
        String labId,
        String name,
        EquipmentType type,
        String serialNumber,
        EquipmentStatus status
) {

    public Equipment {
        Objects.requireNonNull(id, "id must not be null");
        labId = requireText(labId, "labId");
        name = requireText(name, "name");
        Objects.requireNonNull(type, "type must not be null");
        serialNumber = requireText(serialNumber, "serialNumber");
        Objects.requireNonNull(status, "status must not be null");
    }

    public boolean isAvailable() {
        return status == EquipmentStatus.AVAILABLE;
    }

    public Equipment withStatus(EquipmentStatus newStatus) {
        return new Equipment(id, labId, name, type, serialNumber, newStatus);
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }
}
