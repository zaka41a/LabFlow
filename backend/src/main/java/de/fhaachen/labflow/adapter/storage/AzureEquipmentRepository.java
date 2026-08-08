package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.EquipmentRepository;
import de.fhaachen.labflow.domain.Equipment;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "azure")
public class AzureEquipmentRepository implements EquipmentRepository {

    private final AzureBlobJsonStore store;

    public AzureEquipmentRepository(AzureBlobJsonStore store) {
        this.store = store;
    }

    @Override
    public List<Equipment> findAll() {
        return store.findAll("labs/", "/equipment/", Equipment.class);
    }

    @Override
    public Optional<Equipment> findById(UUID id) {
        return findAll().stream().filter(item -> item.id().equals(id)).findFirst();
    }

    @Override
    public Equipment save(Equipment equipment) {
        return store.save(blobName(equipment.labId(), equipment.id()), equipment);
    }

    private static String blobName(String labId, UUID id) {
        return "labs/" + labId + "/equipment/" + id + ".json";
    }
}
