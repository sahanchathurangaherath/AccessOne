package lk.AccessOne.entry.web.dto;

import java.time.LocalDateTime;

public record AlertRow(
        Long id,
        String alertType,
        String severity,
        String message,
        String areaName,
        String status,
        LocalDateTime createdAt) { }
