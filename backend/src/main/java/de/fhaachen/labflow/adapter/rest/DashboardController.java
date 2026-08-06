package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.EquipmentService;
import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final EquipmentService equipmentService;

    public DashboardController(EquipmentService equipmentService) {
        this.equipmentService = equipmentService;
    }

    @GetMapping("/summary")
    public DashboardSummary summary(@RequestParam(required = false) String labId) {
        List<Equipment> equipment = equipmentService.findAll(labId);
        return new DashboardSummary(
                equipment.size(),
                count(equipment, EquipmentStatus.AVAILABLE),
                count(equipment, EquipmentStatus.RESERVED),
                count(equipment, EquipmentStatus.CHECKED_OUT),
                count(equipment, EquipmentStatus.MAINTENANCE)
        );
    }

    private long count(List<Equipment> equipment, EquipmentStatus status) {
        return equipment.stream().filter(item -> item.status() == status).count();
    }

    public record DashboardSummary(
            int total,
            long available,
            long reserved,
            long checkedOut,
            long maintenance
    ) {
    }
}
