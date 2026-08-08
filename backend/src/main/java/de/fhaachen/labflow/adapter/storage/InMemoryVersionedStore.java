package de.fhaachen.labflow.adapter.storage;

import de.fhaachen.labflow.application.ConcurrencyConflictException;
import de.fhaachen.labflow.domain.VersionedDocument;

import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;
import java.util.function.Function;

final class InMemoryVersionedStore<K, V extends VersionedDocument> {

    private final ConcurrentMap<K, V> values = new ConcurrentHashMap<>();
    private final Function<V, K> keyExtractor;

    InMemoryVersionedStore(Function<V, K> keyExtractor) {
        this.keyExtractor = keyExtractor;
    }

    List<V> findAll() {
        return List.copyOf(values.values());
    }

    Optional<V> find(K key) {
        return Optional.ofNullable(values.get(key));
    }

    V save(V candidate) {
        K key = keyExtractor.apply(candidate);
        return values.compute(key, (ignored, current) -> {
            if (current == null) {
                return candidate;
            }
            if (candidate.revision() != current.revision() + 1) {
                throw new ConcurrencyConflictException(
                        "Document revision is stale for key " + key
                );
            }
            return candidate;
        });
    }
}
