package lk.AccessOne.shared.storage;

import lk.AccessOne.shared.error.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Stream;

/**
 * One place for every module's file uploads. A card photo, a police report
 * and a visitor photo all need the same three guarantees -- a generated
 * filename, a size and type check, and a path that provably stays under the
 * storage root -- and only the folder name and the limits differ between them.
 */
@Service
public class FileStorageService {

    public static final Set<String> IMAGES = Set.of("image/jpeg", "image/png");
    public static final Set<String> DOCUMENTS =
            Set.of("image/jpeg", "image/png", "application/pdf");

    private final Path root;

    public FileStorageService(@Value("${accessone.storage.root}") String root) {
        this.root = Paths.get(root).toAbsolutePath().normalize();
    }

    /**
     * @param folder      logical grouping, e.g. "requests", "cards", "visitors"
     * @param ownerId     the id that folder is partitioned by
     * @param allowedTypes MIME types this call site accepts -- a card photo and
     *                    a police report have different rules, so the limits
     *                    stay at the call site rather than living here
     */
    public String store(String folder, Long ownerId, MultipartFile file,
                        Set<String> allowedTypes, long maxBytes) {
        validate(file, allowedTypes, maxBytes);
        try {
            Path dir = root.resolve(folder).resolve(String.valueOf(ownerId));
            Files.createDirectories(dir);

            // A generated filename, never the user's. An uploaded name can
            // contain path separators, and the original is kept in the
            // database for display anyway.
            String extension = extensionOf(file.getContentType());
            String stored = UUID.randomUUID() + extension;

            Path target = dir.resolve(stored);
            if (!target.normalize().startsWith(root)) {
                throw new BusinessRuleException("BAD_PATH", "Invalid file name.");
            }
            file.transferTo(target);

            return root.relativize(target).toString().replace('\\', '/');
        } catch (IOException e) {
            throw new BusinessRuleException("STORAGE_FAILED",
                "Could not save the file. Try again.");
        }
    }

    public Path resolve(String relativePath) {
        Path target = root.resolve(relativePath).normalize();
        if (!target.startsWith(root)) {
            throw new BusinessRuleException("BAD_PATH", "Invalid file path.");
        }
        return target;
    }

    /**
     * Deleting an owning record removes its rows by cascade, but never its
     * files -- nothing in the database points back to say they exist. Every
     * module that deletes an owner of uploaded files should call this in the
     * same transaction.
     */
    public void deleteFolder(String folder, Long ownerId) {
        Path dir = root.resolve(folder).resolve(String.valueOf(ownerId)).normalize();
        if (!dir.startsWith(root)) {
            throw new BusinessRuleException("BAD_PATH", "Invalid folder path.");
        }
        if (!Files.exists(dir)) return;

        try (Stream<Path> walk = Files.walk(dir)) {
            walk.sorted(Comparator.reverseOrder()).forEach(path -> {
                try {
                    Files.delete(path);
                } catch (IOException e) {
                    // Best effort -- an orphaned file on disk is a cleanup
                    // task, not a reason to fail the request that triggered it.
                }
            });
        } catch (IOException e) {
            throw new BusinessRuleException("STORAGE_FAILED", "Could not remove stored files.");
        }
    }

    private void validate(MultipartFile file, Set<String> allowedTypes, long maxBytes) {
        if (file == null || file.isEmpty()) {
            throw new BusinessRuleException("EMPTY_FILE", "Choose a file to upload.");
        }
        if (file.getSize() > maxBytes) {
            throw new BusinessRuleException("FILE_TOO_LARGE",
                "Files must be under %d MB.".formatted(maxBytes / (1024 * 1024)));
        }
        String contentType = file.getContentType();
        if (contentType == null || !allowedTypes.contains(contentType)) {
            throw new BusinessRuleException("UNSUPPORTED_TYPE",
                "This file type isn't accepted here.");
        }
    }

    private String extensionOf(String contentType) {
        return switch (contentType) {
            case "image/png" -> ".png";
            case "application/pdf" -> ".pdf";
            default -> ".jpg";
        };
    }
}
