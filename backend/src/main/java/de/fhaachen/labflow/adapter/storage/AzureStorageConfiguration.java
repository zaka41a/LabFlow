package de.fhaachen.labflow.adapter.storage;

import com.azure.core.http.jdk.httpclient.JdkHttpClientBuilder;
import com.azure.storage.blob.BlobContainerClient;
import com.azure.storage.blob.BlobServiceClientBuilder;
import com.azure.storage.blob.BlobServiceVersion;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration(proxyBeanMethods = false)
@ConditionalOnProperty(name = "labflow.storage.mode", havingValue = "azure")
public class AzureStorageConfiguration {

    @Bean
    BlobContainerClient labFlowBlobContainer(
            @Value("${labflow.storage.connection-string}") String connectionString,
            @Value("${labflow.storage.container}") String containerName
    ) {
        if (connectionString.isBlank()) {
            throw new IllegalStateException(
                    "AZURE_STORAGE_CONNECTION_STRING is required for Azure storage mode"
            );
        }

        BlobContainerClient container = new BlobServiceClientBuilder()
                .connectionString(connectionString)
                .httpClient(new JdkHttpClientBuilder().build())
                .serviceVersion(BlobServiceVersion.V2025_11_05)
                .buildClient()
                .getBlobContainerClient(containerName);
        container.createIfNotExists();
        return container;
    }
}
