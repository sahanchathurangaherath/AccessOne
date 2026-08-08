package lk.AccessOne.cardrequest.service;

import lk.AccessOne.shared.error.BusinessRuleException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Set;
import java.util.UUID;

@Service
public class FileStorageService {

    private static final Set<String> ALLOWED_IMAGE =
            Set.of("image/jpeg", "image/png");
    private static final Set<String> ALLOWED_DOCUMENT =
            Set.of("image/jpeg", "image/png", "application/pdf");
    private static final long MAX_DOCUMENT_BYTES = 5L * 1024 * 1024;   // matches chk_reqdocs_size
    private static final long MAX_PHOTO_BYTES = 2L * 1024 * 1024;

    private final Path root;

    public FileStorageService(@Value("${accessone.storage.root}") String root) {
        this.root = Paths.get(root).toAbsolutePath().normalize();
    }

    public String storePhoto(Long requestId, MultipartFile file) {
        validate(file, ALLOWED_IMAGE, MAX_PHOTO_BYTES);
        return store(requestId, file);
    }

    public String storeDocument(Long requestId, MultipartFile file) {
        validate(file, ALLOWED_DOCUMENT, MAX_DOCUMENT_BYTES);
        return store(requestId, file);
    }

    private String store(Long requestId, MultipartFile file) {
        try {
            Path folder = root.resolve("requests").resolve(String.valueOf(requestId));
            Files.createDirectories(folder);

            // A generated filename, never the user's. An uploaded name can
            // contain path separators, and the original is kept in the
            // database for display anyway.
            String extension = extensionOf(file.getContentType());
            String stored = UUID.randomUUID() + extension;

            Path target = folder.resolve(stored);
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
                "Upload a JPEG, PNG or PDF.");
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
