package de.fhaachen.labflow.application;

import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentStatus;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
public class EquipmentService {

    private final EquipmentRepository repository;
    private final EquipmentImageRepository images;

    public EquipmentService(
            EquipmentRepository repository,
            EquipmentImageRepository images
    ) {
        this.repository = repository;
        this.images = images;
    }

    public List<Equipment> findAll(String labId) {
        return repository.findAll().stream()
                .filter(equipment -> labId == null || equipment.labId().equalsIgnoreCase(labId))
                .sorted(Comparator.comparing(Equipment::name))
                .toList();
    }

    public synchronized Equipment create(
            CreateEquipmentCommand command,
            AuthenticatedActor actor
    ) {
        requireTechnician(actor);
        boolean serialNumberExists = repository.findAll().stream()
                .anyMatch(item -> item.labId().equals(actor.labId())
                        && item.serialNumber().equalsIgnoreCase(command.serialNumber()));
        if (serialNumberExists) {
            throw new ConcurrencyConflictException(
                    "An equipment item with this inventory number already exists"
            );
        }

        UUID equipmentId = UUID.randomUUID();
        Equipment equipment = new Equipment(
                equipmentId,
                actor.labId(),
                command.name(),
                command.type(),
                command.serialNumber(),
                EquipmentStatus.AVAILABLE,
                command.accessPolicy(),
                command.requiredQualification(),
                "/api/equipment/" + equipmentId + "/image",
                0
        );

        images.save(actor.labId(), equipmentId, command.image());
        try {
            return repository.save(equipment);
        } catch (RuntimeException exception) {
            try {
                images.delete(actor.labId(), equipmentId);
            } catch (RuntimeException cleanupFailure) {
                exception.addSuppressed(cleanupFailure);
            }
            throw exception;
        }
    }

    public EquipmentImage findImage(UUID equipmentId, AuthenticatedActor actor) {
        Equipment equipment = repository.findById(equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment was not found"));
        if (!equipment.labId().equals(actor.labId())) {
            throw new AccessViolationException("Equipment belongs to another laboratory");
        }
        return images.find(actor.labId(), equipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Equipment image was not found"));
    }

    private static void requireTechnician(AuthenticatedActor actor) {
        if (!"TECHNICIAN".equals(actor.role())) {
            throw new AccessViolationException("Only technicians may add equipment");
        }
    }
}
