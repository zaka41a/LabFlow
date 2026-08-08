package de.fhaachen.labflow.application;

import java.util.Optional;
import java.util.UUID;

public interface EquipmentImageRepository {

    EquipmentImage save(String labId, UUID equipmentId, EquipmentImage image);

    Optional<EquipmentImage> find(String labId, UUID equipmentId);

    void delete(String labId, UUID equipmentId);
}
