package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.EquipmentRepository;
import de.fhaachen.labflow.domain.Equipment;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "memory", matchIfMissing = true)
public class InMemoryEquipmentRepository implements EquipmentRepository {

    private final InMemoryVersionedStore<UUID, Equipment> store =
            new InMemoryVersionedStore<>(Equipment::id);

    @Override
    public List<Equipment> findAll() {
        return store.findAll();
    }

    @Override
    public Optional<Equipment> findById(UUID id) {
        return store.find(id);
    }

    @Override
    public Equipment save(Equipment equipment) {
        return store.save(equipment);
    }
}
