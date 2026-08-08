package de.fhaachen.labflow.domain;

import java.util.Objects;
import java.util.UUID;

public record Equipment(
        UUID id,
        String labId,
        String name,
        EquipmentType type,
        String serialNumber,
        EquipmentStatus status,
        EquipmentAccessPolicy accessPolicy,
        String requiredQualification,
        String imageUrl,
        long revision
) implements VersionedDocument {

    public Equipment {
        Objects.requireNonNull(id, "id must not be null");
        labId = requireText(labId, "labId");
        name = requireText(name, "name");
        Objects.requireNonNull(type, "type must not be null");
        serialNumber = requireText(serialNumber, "serialNumber");
        Objects.requireNonNull(status, "status must not be null");
        accessPolicy = accessPolicy == null ? EquipmentAccessPolicy.OPEN : accessPolicy;
        requiredQualification = optionalText(requiredQualification);
        if (accessPolicy.requiresVerification() && requiredQualification == null) {
            throw new IllegalArgumentException(
                    "requiredQualification must be provided for restricted equipment"
            );
        }
        imageUrl = requireText(imageUrl, "imageUrl");
        if (revision < 0) {
            throw new IllegalArgumentException("revision must not be negative");
        }
    }

    public boolean isAvailable() {
        return status == EquipmentStatus.AVAILABLE;
    }

    public boolean requiresAccessVerification() {
        return accessPolicy.requiresVerification();
    }

    public Equipment withStatus(EquipmentStatus newStatus) {
        return new Equipment(
                id,
                labId,
                name,
                type,
                serialNumber,
                newStatus,
                accessPolicy,
                requiredQualification,
                imageUrl,
                revision + 1
        );
    }

    private static String requireText(String value, String field) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return value.trim();
    }

    private static String optionalText(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
