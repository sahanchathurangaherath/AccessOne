package lk.AccessOne.entry.web.dto;

import java.time.LocalDateTime;

public record AlertDetail(
        Long id,
        String alertType,
        String severity,
        String message,
        Long relatedAccessLogId,
        Long areaId,
        String areaName,
        String status,
        String acknowledgedByUsername,
        LocalDateTime acknowledgedAt,
        LocalDateTime createdAt) { }
