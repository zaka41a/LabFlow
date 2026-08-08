package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.LoanRequestRepository;
import de.fhaachen.labflow.domain.LoanRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "azure")
public class AzureLoanRequestRepository implements LoanRequestRepository {

    private final AzureBlobJsonStore store;

    public AzureLoanRequestRepository(AzureBlobJsonStore store) {
        this.store = store;
    }

    @Override
    public List<LoanRequest> findAll() {
        return store.findAll("labs/", "/loan-requests/", LoanRequest.class);
    }

    @Override
    public Optional<LoanRequest> findById(UUID id) {
        return findAll().stream().filter(request -> request.id().equals(id)).findFirst();
    }

    @Override
    public LoanRequest save(LoanRequest request) {
        return store.save(blobName(request.labId(), request.id()), request);
    }

    private static String blobName(String labId, UUID id) {
        return "labs/" + labId + "/loan-requests/" + id + ".json";
    }
}
