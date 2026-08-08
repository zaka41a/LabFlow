package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.CheckoutRecord;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface CheckoutRecordRepository {

    List<CheckoutRecord> findAll();

    Optional<CheckoutRecord> findByLoanRequestId(UUID loanRequestId);

    CheckoutRecord save(CheckoutRecord checkoutRecord);
}
