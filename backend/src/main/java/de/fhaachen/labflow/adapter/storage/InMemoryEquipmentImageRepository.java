package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.ConcurrencyConflictException;
import de.fhaachen.labflow.application.EquipmentImage;
import de.fhaachen.labflow.application.EquipmentImageRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "memory", matchIfMissing = true)
public class InMemoryEquipmentImageRepository implements EquipmentImageRepository {

    private final ConcurrentHashMap<ImageKey, EquipmentImage> images = new ConcurrentHashMap<>();

    @Override
    public EquipmentImage save(String labId, UUID equipmentId, EquipmentImage image) {
        ImageKey key = new ImageKey(labId, equipmentId);
        if (images.putIfAbsent(key, image) != null) {
            throw new ConcurrencyConflictException("Equipment image already exists");
        }
        return image;
    }

    @Override
    public Optional<EquipmentImage> find(String labId, UUID equipmentId) {
        return Optional.ofNullable(images.get(new ImageKey(labId, equipmentId)));
    }

    @Override
    public void delete(String labId, UUID equipmentId) {
        images.remove(new ImageKey(labId, equipmentId));
    }

    private record ImageKey(String labId, UUID equipmentId) {
    }
}
