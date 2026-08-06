package de.fhaachen.labflow.config;

import de.fhaachen.labflow.application.EquipmentRepository;
import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentStatus;
import de.fhaachen.labflow.domain.EquipmentType;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;
import java.util.UUID;

@Configuration(proxyBeanMethods = false)
public class DemoDataConfiguration {

    @Bean
    ApplicationRunner seedEquipment(EquipmentRepository repository) {
        return arguments -> {
            if (!repository.findAll().isEmpty()) {
                return;
            }

            List.of(
                    equipment("20000000-0000-0000-0000-000000000001", "LAB_A", "Dell Precision 5680", EquipmentType.LAPTOP, "LAP-2026-014", EquipmentStatus.AVAILABLE),
                    equipment("20000000-0000-0000-0000-000000000002", "LAB_A", "Bosch BME688 Sensor Kit", EquipmentType.SENSOR, "SEN-2026-031", EquipmentStatus.RESERVED),
                    equipment("20000000-0000-0000-0000-000000000003", "LAB_A", "Fluke 117 Multimeter", EquipmentType.MEASURING_DEVICE, "MEA-2025-117", EquipmentStatus.CHECKED_OUT),
                    equipment("20000000-0000-0000-0000-000000000004", "LAB_B", "Raspberry Pi 5 Lab Set", EquipmentType.MICROCONTROLLER, "MIC-2026-008", EquipmentStatus.AVAILABLE),
                    equipment("20000000-0000-0000-0000-000000000005", "LAB_B", "Sony Alpha Documentation Camera", EquipmentType.CAMERA, "CAM-2024-006", EquipmentStatus.MAINTENANCE)
            ).forEach(repository::save);
        };
    }

    private Equipment equipment(
            String id,
            String labId,
            String name,
            EquipmentType type,
            String serialNumber,
            EquipmentStatus status
    ) {
        return new Equipment(UUID.fromString(id), labId, name, type, serialNumber, status);
    }
}
