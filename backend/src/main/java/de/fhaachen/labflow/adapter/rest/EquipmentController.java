package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.EquipmentService;
import de.fhaachen.labflow.domain.Equipment;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/equipment")
public class EquipmentController {

    private final EquipmentService service;

    public EquipmentController(EquipmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Equipment> findAll(@RequestParam(required = false) String labId) {
        return service.findAll(labId);
    }
}
