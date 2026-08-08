package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.AuditEventRepository;
import de.fhaachen.labflow.domain.AuditEvent;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import de.fhaachen.labflow.application.ConcurrencyConflictException;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "memory", matchIfMissing = true)
public class InMemoryAuditEventRepository implements AuditEventRepository {

    private final ConcurrentHashMap<UUID, AuditEvent> events = new ConcurrentHashMap<>();

    @Override
    public List<AuditEvent> findAll() {
        return List.copyOf(events.values());
    }

    @Override
    public AuditEvent save(AuditEvent event) {
        if (events.putIfAbsent(event.id(), event) != null) {
            throw new ConcurrencyConflictException("Audit event already exists: " + event.id());
        }
        return event;
    }
}
