package lk.AccessOne.notification.web.dto;

import java.time.LocalDateTime;

public record NotificationDto(
        Long id,
        String type,
        String title,
        String message,
        String entityName,
        Long entityId,
        String actionPath,
        boolean read,
        LocalDateTime createdAt
) { }
