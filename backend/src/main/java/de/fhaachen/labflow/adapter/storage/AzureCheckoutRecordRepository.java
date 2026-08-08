package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.CheckoutRecordRepository;
import de.fhaachen.labflow.domain.CheckoutRecord;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "azure")
public class AzureCheckoutRecordRepository implements CheckoutRecordRepository {

    private final AzureBlobJsonStore store;

    public AzureCheckoutRecordRepository(AzureBlobJsonStore store) {
        this.store = store;
    }

    @Override
    public List<CheckoutRecord> findAll() {
        return store.findAll("labs/", "/checkout-records/", CheckoutRecord.class);
    }

    @Override
    public Optional<CheckoutRecord> findByLoanRequestId(UUID loanRequestId) {
        return findAll().stream()
                .filter(record -> record.loanRequestId().equals(loanRequestId))
                .findFirst();
    }

    @Override
    public CheckoutRecord save(CheckoutRecord record) {
        return store.save(blobName(record.labId(), record.loanRequestId()), record);
    }

    private static String blobName(String labId, UUID requestId) {
        return "labs/" + labId + "/checkout-records/" + requestId + ".json";
    }
}
