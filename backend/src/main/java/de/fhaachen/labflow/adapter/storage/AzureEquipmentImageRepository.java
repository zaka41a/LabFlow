package de.fhaachen.labflow.adapter.storage;

import com.azure.core.util.BinaryData;
import com.azure.core.util.Context;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.models.BlobHttpHeaders;
import com.azure.storage.blob.models.BlobRequestConditions;
import com.azure.storage.blob.models.BlobStorageException;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import de.fhaachen.labflow.application.ConcurrencyConflictException;
import de.fhaachen.labflow.application.EquipmentImage;
import de.fhaachen.labflow.application.EquipmentImageRepository;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "azure")
public class AzureEquipmentImageRepository implements EquipmentImageRepository {

    private final BlobContainerClient container;

    public AzureEquipmentImageRepository(BlobContainerClient container) {
        this.container = container;
    }

    @Override
    public EquipmentImage save(String labId, UUID equipmentId, EquipmentImage image) {
        String blobName = blobName(labId, equipmentId);
        BlobParallelUploadOptions options = new BlobParallelUploadOptions(
                BinaryData.fromBytes(image.content())
        ).setHeaders(new BlobHttpHeaders().setContentType(image.contentType()))
                .setRequestConditions(new BlobRequestConditions().setIfNoneMatch("*"));
        try {
            container.getBlobClient(blobName).uploadWithResponse(options, null, Context.NONE);
            return image;
        } catch (BlobStorageException exception) {
            if (exception.getStatusCode() == 409 || exception.getStatusCode() == 412) {
                throw new ConcurrencyConflictException(
                        "Equipment image already exists",
                        exception
                );
            }
            throw exception;
        }
    }

    @Override
    public Optional<EquipmentImage> find(String labId, UUID equipmentId) {
        var blob = container.getBlobClient(blobName(labId, equipmentId));
        if (!blob.exists()) {
            return Optional.empty();
        }
        return Optional.of(new EquipmentImage(
                blob.downloadContent().toBytes(),
                blob.getProperties().getContentType()
        ));
    }

    @Override
    public void delete(String labId, UUID equipmentId) {
        container.getBlobClient(blobName(labId, equipmentId)).deleteIfExists();
    }

    private static String blobName(String labId, UUID equipmentId) {
        return "labs/" + labId + "/equipment-images/" + equipmentId + ".bin";
    }
}
