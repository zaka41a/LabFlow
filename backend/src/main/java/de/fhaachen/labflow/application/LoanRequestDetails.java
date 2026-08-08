package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.LoanRequest;

import java.util.Objects;

public record LoanRequestDetails(LoanRequest request, Equipment equipment) {

    public LoanRequestDetails {
        Objects.requireNonNull(request, "request must not be null");
        Objects.requireNonNull(equipment, "equipment must not be null");
    }
}
