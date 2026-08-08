package de.fhaachen.labflow.config;

import de.fhaachen.labflow.application.EquipmentRepository;
import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentAccessPolicy;
import de.fhaachen.labflow.domain.EquipmentStatus;
import de.fhaachen.labflow.domain.EquipmentType;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

@Configuration(proxyBeanMethods = false)
public class EquipmentCatalogConfiguration {

    @Bean
    ApplicationRunner seedEquipment(EquipmentRepository repository) {
        return arguments -> {
            Set<UUID> existingIds = repository.findAll().stream()
                    .map(Equipment::id)
                    .collect(Collectors.toSet());

            equipmentCatalog().stream()
                    .filter(item -> !existingIds.contains(item.id()))
                    .forEach(repository::save);
        };
    }

    private List<Equipment> equipmentCatalog() {
        return List.of(
                equipment(
                        "20000000-0000-0000-0000-000000000001",
                        "Dell Precision 5680",
                        EquipmentType.LAPTOP,
                        "LAP-2026-014",
                        EquipmentStatus.AVAILABLE,
                        EquipmentAccessPolicy.OPEN,
                        null,
                        "/equipment/dell-precision-5680.webp"
                ),
                equipment(
                        "20000000-0000-0000-0000-000000000002",
                        "Bosch BME688 Sensor Kit",
                        EquipmentType.SENSOR,
                        "SEN-2026-031",
                        EquipmentStatus.AVAILABLE,
                        EquipmentAccessPolicy.OPEN,
                        null,
                        "/equipment/bme688-sensor-kit.webp"
                ),
                equipment(
                        "20000000-0000-0000-0000-000000000003",
                        "Fluke 117 Multimeter",
                        EquipmentType.MEASURING_DEVICE,
                        "MEA-2025-117",
                        EquipmentStatus.AVAILABLE,
                        EquipmentAccessPolicy.OPEN,
                        null,
                        "/equipment/fluke-117-multimeter.webp"
                ),
                equipment(
                        "20000000-0000-0000-0000-000000000004",
                        "Raspberry Pi 5 Lab Set",
                        EquipmentType.MICROCONTROLLER,
                        "MIC-2026-008",
                        EquipmentStatus.AVAILABLE,
                        EquipmentAccessPolicy.OPEN,
                        null,
                        "/equipment/raspberry-pi-5-lab-set.webp"
                ),
                equipment(
                        "20000000-0000-0000-0000-000000000005",
                        "Sony Alpha Dokumentationskamera",
                        EquipmentType.CAMERA,
                        "CAM-2024-006",
                        EquipmentStatus.MAINTENANCE,
                        EquipmentAccessPolicy.OPEN,
                        null,
                        "/equipment/sony-alpha-camera.webp"
                ),
                equipment(
                        "20000000-0000-0000-0000-000000000006",
                        "Keysight EDUX1052G",
                        EquipmentType.MEASURING_DEVICE,
                        "OSC-2026-022",
                        EquipmentStatus.AVAILABLE,
                        EquipmentAccessPolicy.OPEN,
                        null,
                        "/equipment/keysight-edux1052g.webp"
                ),
                equipment(
                        "20000000-0000-0000-0000-000000000007",
                        "Akku-Bohrschrauber 18 V",
                        EquipmentType.POWER_TOOL,
                        "WKS-2026-018",
                        EquipmentStatus.AVAILABLE,
                        EquipmentAccessPolicy.INSTRUCTION_REQUIRED,
                        "Werkstattunterweisung für handgeführte Elektrowerkzeuge",
                        "/equipment/cordless-drill.webp"
                ),
                equipment(
                        "20000000-0000-0000-0000-000000000008",
                        "Lötstation 80 W",
                        EquipmentType.SOLDERING_EQUIPMENT,
                        "ELK-2026-043",
                        EquipmentStatus.AVAILABLE,
                        EquipmentAccessPolicy.INSTRUCTION_REQUIRED,
                        "Unterweisung für Lötarbeitsplätze",
                        "/equipment/soldering-station.webp"
                ),
                equipment(
                        "20000000-0000-0000-0000-000000000009",
                        "Laborzentrifuge 12 × 15 ml",
                        EquipmentType.LABORATORY_DEVICE,
                        "BIO-2026-012",
                        EquipmentStatus.AVAILABLE,
                        EquipmentAccessPolicy.QUALIFICATION_REQUIRED,
                        "Zentrifugenunterweisung und Freigabe der Laborleitung",
                        "/equipment/laboratory-centrifuge.webp"
                )
        );
    }

    private Equipment equipment(
            String id,
            String name,
            EquipmentType type,
            String serialNumber,
            EquipmentStatus status,
            EquipmentAccessPolicy accessPolicy,
            String requiredQualification,
            String imageUrl
    ) {
        return new Equipment(
                UUID.fromString(id),
                "FH_AACHEN",
                name,
                type,
                serialNumber,
                status,
                accessPolicy,
                requiredQualification,
                imageUrl,
                0
        );
    }
}
