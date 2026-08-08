package lk.AccessOne.shared.service;

import lk.AccessOne.shared.error.ResourceNotFoundException;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Component;

import java.util.Optional;

/**
 * "Look this up, or say clearly it doesn't exist" is character-identical in
 * every service in the system. One place for it means one 404 shape
 * everywhere, rather than each module inventing its own.
 */
@Component
public class EntityLookup {

    public <T, ID> T require(JpaRepository<T, ID> repository, ID id, String label) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(label, id));
    }

    public <T> T require(Optional<T> maybe, String label, Object id) {
        return maybe.orElseThrow(() -> new ResourceNotFoundException(label, id));
    }
}
