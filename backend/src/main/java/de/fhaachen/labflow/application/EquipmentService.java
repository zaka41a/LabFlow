package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.Equipment;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;

@Service
public class EquipmentService {

    private final EquipmentRepository repository;

    public EquipmentService(EquipmentRepository repository) {
        this.repository = repository;
    }

    public List<Equipment> findAll(String labId) {
        return repository.findAll().stream()
                .filter(equipment -> labId == null || equipment.labId().equalsIgnoreCase(labId))
                .sorted(Comparator.comparing(Equipment::name))
                .toList();
    }
}
