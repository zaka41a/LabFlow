package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.AuditEventRepository;
import de.fhaachen.labflow.domain.AuditEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "azure")
public class AzureAuditEventRepository implements AuditEventRepository {

    private final AzureBlobJsonStore store;

    public AzureAuditEventRepository(AzureBlobJsonStore store) {
        this.store = store;
    }

    @Override
    public List<AuditEvent> findAll() {
        return store.findAll("labs/", "/audit-events/", AuditEvent.class);
    }

    @Override
    public AuditEvent save(AuditEvent event) {
        String blobName = "labs/" + event.labId() + "/audit-events/"
                + event.occurredAt().toEpochMilli() + "-" + event.id() + ".json";
        return store.saveImmutable(blobName, event);
    }
}
