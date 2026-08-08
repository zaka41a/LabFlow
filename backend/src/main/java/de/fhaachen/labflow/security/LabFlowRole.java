package de.fhaachen.labflow.security;

public enum LabFlowRole {
    BORROWER,
    LAB_MANAGER,
    TECHNICIAN;

    public String authority() {
        return "ROLE_" + name();
    }
}
