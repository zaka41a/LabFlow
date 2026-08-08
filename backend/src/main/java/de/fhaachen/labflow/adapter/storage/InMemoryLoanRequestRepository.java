package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.LoanRequestRepository;
import de.fhaachen.labflow.domain.LoanRequest;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "memory", matchIfMissing = true)
public class InMemoryLoanRequestRepository implements LoanRequestRepository {

    private final InMemoryVersionedStore<UUID, LoanRequest> store =
            new InMemoryVersionedStore<>(LoanRequest::id);

    @Override
    public List<LoanRequest> findAll() {
        return store.findAll();
    }

    @Override
    public Optional<LoanRequest> findById(UUID id) {
        return store.find(id);
    }

    @Override
    public LoanRequest save(LoanRequest loanRequest) {
        return store.save(loanRequest);
    }
}
