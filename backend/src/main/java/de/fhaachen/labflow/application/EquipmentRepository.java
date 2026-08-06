package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.Equipment;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface EquipmentRepository {

    List<Equipment> findAll();

    Optional<Equipment> findById(UUID id);

    Equipment save(Equipment equipment);
}
