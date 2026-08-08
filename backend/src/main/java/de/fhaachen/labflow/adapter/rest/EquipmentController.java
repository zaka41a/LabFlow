package de.fhaachen.labflow.adapter.rest;

import de.fhaachen.labflow.application.CreateEquipmentCommand;
import de.fhaachen.labflow.application.EquipmentImage;
import de.fhaachen.labflow.application.EquipmentService;
import de.fhaachen.labflow.domain.Equipment;
import de.fhaachen.labflow.domain.EquipmentAccessPolicy;
import de.fhaachen.labflow.domain.EquipmentType;
import de.fhaachen.labflow.security.LabFlowPrincipal;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.Duration;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/equipment")
@Validated
public class EquipmentController {

    private final EquipmentService service;

    public EquipmentController(EquipmentService service) {
        this.service = service;
    }

    @GetMapping
    public List<Equipment> findAll(@AuthenticationPrincipal LabFlowPrincipal user) {
        return service.findAll(user.labId());
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public Equipment create(
            @RequestParam("name") @NotBlank @Size(max = 120) String name,
            @RequestParam("type") @NotNull EquipmentType type,
            @RequestParam("serialNumber") @NotBlank @Size(max = 64) String serialNumber,
            @RequestParam("accessPolicy") @NotNull EquipmentAccessPolicy accessPolicy,
            @RequestParam(name = "requiredQualification", required = false)
            @Size(max = 300) String requiredQualification,
            @RequestPart("image") @NotNull MultipartFile image,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        try {
            return service.create(
                    new CreateEquipmentCommand(
                            name,
                            type,
                            serialNumber,
                            accessPolicy,
                            requiredQualification,
                            new EquipmentImage(image.getBytes(), image.getContentType())
                    ),
                    RestActorMapper.from(user)
            );
        } catch (IOException exception) {
            throw new IllegalArgumentException("Equipment image could not be read", exception);
        }
    }

    @GetMapping("/{equipmentId}/image")
    public ResponseEntity<byte[]> findImage(
            @PathVariable UUID equipmentId,
            @AuthenticationPrincipal LabFlowPrincipal user
    ) {
        EquipmentImage image = service.findImage(equipmentId, RestActorMapper.from(user));
        byte[] content = image.content();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(image.contentType()))
                .contentLength(content.length)
                .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePrivate().immutable())
                .body(content);
    }
}
