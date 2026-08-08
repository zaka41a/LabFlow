package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.EquipmentAccessPolicy;
import de.fhaachen.labflow.domain.EquipmentType;

import java.util.Objects;

public record CreateEquipmentCommand(
        String name,
        EquipmentType type,
        String serialNumber,
        EquipmentAccessPolicy accessPolicy,
        String requiredQualification,
        EquipmentImage image
) {

    public CreateEquipmentCommand {
        name = requireText(name, "name", 120);
        Objects.requireNonNull(type, "type must not be null");
        serialNumber = requireText(serialNumber, "serialNumber", 64);
        accessPolicy = accessPolicy == null ? EquipmentAccessPolicy.OPEN : accessPolicy;
        requiredQualification = optionalText(requiredQualification, "requiredQualification", 300);
        if (accessPolicy.requiresVerification() && requiredQualification == null) {
            throw new IllegalArgumentException(
                    "requiredQualification must be provided for restricted equipment"
            );
        }
        Objects.requireNonNull(image, "image must not be null");
    }

    private static String requireText(String value, String field, int maximumLength) {
        String normalized = optionalText(value, field, maximumLength);
        if (normalized == null) {
            throw new IllegalArgumentException(field + " must not be blank");
        }
        return normalized;
    }

    private static String optionalText(String value, String field, int maximumLength) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim();
        if (normalized.length() > maximumLength) {
            throw new IllegalArgumentException(field + " exceeds maximum length");
        }
        return normalized;
    }
}
