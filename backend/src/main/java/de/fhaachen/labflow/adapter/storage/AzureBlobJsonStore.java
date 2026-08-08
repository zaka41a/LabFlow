package de.fhaachen.labflow.adapter.storage;

import com.azure.core.util.BinaryData;
import com.azure.core.util.Context;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.models.BlobRequestConditions;
import com.azure.storage.blob.models.BlobStorageException;
import com.azure.storage.blob.options.BlobParallelUploadOptions;
import de.fhaachen.labflow.application.ConcurrencyConflictException;
import de.fhaachen.labflow.domain.VersionedDocument;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import tools.jackson.core.JacksonException;
import tools.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Component
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "azure")
public class AzureBlobJsonStore {

    private final BlobContainerClient container;
    private final ObjectMapper objectMapper;

    public AzureBlobJsonStore(BlobContainerClient container, ObjectMapper objectMapper) {
        this.container = container;
        this.objectMapper = objectMapper;
    }

    public <T extends VersionedDocument> T save(String blobName, T value) {
        try {
            byte[] document = objectMapper.writeValueAsBytes(value);
            CurrentDocument current = readCurrent(blobName, value.getClass());

            BlobRequestConditions conditions = new BlobRequestConditions();
            if (current == null) {
                conditions.setIfNoneMatch("*");
            } else {
                if (value.revision() != current.revision() + 1) {
                    throw new ConcurrencyConflictException(
                            "Document revision is stale for blob " + blobName
                    );
                }
                conditions.setIfMatch(current.etag());
            }

            upload(blobName, document, conditions);
            return value;
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize blob " + blobName, exception);
        }
    }

    public <T> T saveImmutable(String blobName, T value) {
        try {
            byte[] document = objectMapper.writeValueAsBytes(value);
            upload(
                    blobName,
                    document,
                    new BlobRequestConditions().setIfNoneMatch("*")
            );
            return value;
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not serialize blob " + blobName, exception);
        }
    }

    public <T> Optional<T> find(String blobName, Class<T> type) {
        var blob = container.getBlobClient(blobName);
        if (!blob.exists()) {
            return Optional.empty();
        }
        return Optional.of(read(blobName, type));
    }

    public <T> List<T> findAll(String prefix, String pathSegment, Class<T> type) {
        List<T> documents = new ArrayList<>();
        container.listBlobs().forEach(item -> {
            String name = item.getName();
            if (name.startsWith(prefix) && name.contains(pathSegment) && name.endsWith(".json")) {
                documents.add(read(name, type));
            }
        });
        return List.copyOf(documents);
    }

    private <T> T read(String blobName, Class<T> type) {
        try {
            byte[] document = container.getBlobClient(blobName).downloadContent().toBytes();
            return objectMapper.readValue(document, type);
        } catch (JacksonException exception) {
            throw new IllegalStateException("Could not deserialize blob " + blobName, exception);
        }
    }

    private CurrentDocument readCurrent(String blobName, Class<?> type) throws JacksonException {
        try {
            var response = container.getBlobClient(blobName).downloadContentWithResponse(
                    null,
                    null,
                    null,
                    Context.NONE
            );
            Object value = objectMapper.readValue(response.getValue().toBytes(), type);
            if (!(value instanceof VersionedDocument current)) {
                throw new IllegalStateException("Blob is not versioned: " + blobName);
            }
            return new CurrentDocument(
                    current.revision(),
                    response.getDeserializedHeaders().getETag()
            );
        } catch (BlobStorageException exception) {
            if (exception.getStatusCode() == 404) {
                return null;
            }
            throw exception;
        }
    }

    private void upload(
            String blobName,
            byte[] document,
            BlobRequestConditions conditions
    ) {
        try {
            BlobParallelUploadOptions options = new BlobParallelUploadOptions(
                    BinaryData.fromBytes(document)
            ).setRequestConditions(conditions);
            container.getBlobClient(blobName).uploadWithResponse(options, Context.NONE);
        } catch (BlobStorageException exception) {
            if (exception.getStatusCode() == 409 || exception.getStatusCode() == 412) {
                throw new ConcurrencyConflictException(
                        "Concurrent modification detected for blob " + blobName,
                        exception
                );
            }
            throw exception;
        }
    }

    private record CurrentDocument(long revision, String etag) {
    }
}
