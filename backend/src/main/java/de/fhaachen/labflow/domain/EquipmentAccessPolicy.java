package de.fhaachen.labflow.domain;

public enum EquipmentAccessPolicy {
    OPEN(false),
    INSTRUCTION_REQUIRED(true),
    QUALIFICATION_REQUIRED(true);

    private final boolean verificationRequired;

    EquipmentAccessPolicy(boolean verificationRequired) {
        this.verificationRequired = verificationRequired;
    }

    public boolean requiresVerification() {
        return verificationRequired;
    }
}
