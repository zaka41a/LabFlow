package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.EquipmentRepository;
import de.fhaachen.labflow.domain.Equipment;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Repository
public class InMemoryEquipmentRepository implements EquipmentRepository {

    private final ConcurrentHashMap<UUID, Equipment> equipmentById = new ConcurrentHashMap<>();

    @Override
    public List<Equipment> findAll() {
        return List.copyOf(equipmentById.values());
    }

    @Override
    public Optional<Equipment> findById(UUID id) {
        return Optional.ofNullable(equipmentById.get(id));
    }

    @Override
    public Equipment save(Equipment equipment) {
        equipmentById.put(equipment.id(), equipment);
        return equipment;
    }
}
