package lk.AccessOne.cardrequest.web.dto;

import java.time.LocalDateTime;

public record DocumentSummary(
        Long id, String documentType, String fileName,
        String mimeType, int fileSizeBytes, LocalDateTime uploadedAt) { }
