package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.CheckoutRecordRepository;
import de.fhaachen.labflow.domain.CheckoutRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "memory", matchIfMissing = true)
public class InMemoryCheckoutRecordRepository implements CheckoutRecordRepository {

    private final InMemoryVersionedStore<UUID, CheckoutRecord> store =
            new InMemoryVersionedStore<>(CheckoutRecord::loanRequestId);

    @Override
    public List<CheckoutRecord> findAll() {
        return store.findAll();
    }

    @Override
    public Optional<CheckoutRecord> findByLoanRequestId(UUID loanRequestId) {
        return store.find(loanRequestId);
    }

    @Override
    public CheckoutRecord save(CheckoutRecord checkoutRecord) {
        return store.save(checkoutRecord);
    }
}
