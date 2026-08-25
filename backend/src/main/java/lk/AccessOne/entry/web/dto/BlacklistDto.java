package lk.AccessOne.entry.web.dto;

import java.time.LocalDateTime;

public record BlacklistDto(
        Long id,
        String targetType,
        String targetRef,
        String targetName,
        String reason,
        String blacklistedByUsername,
        LocalDateTime blacklistedAt,
        LocalDateTime releasedAt,
        String releasedByUsername,
        boolean active) { }
