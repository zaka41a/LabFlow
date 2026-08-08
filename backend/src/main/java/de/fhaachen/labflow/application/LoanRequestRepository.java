package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.LoanRequest;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface LoanRequestRepository {

    List<LoanRequest> findAll();

    Optional<LoanRequest> findById(UUID id);

    LoanRequest save(LoanRequest loanRequest);
}
