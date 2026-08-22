package lk.AccessOne.entry.web.dto;

import java.time.LocalDateTime;

public record BlacklistRow(
        Long id,
        String targetType,
        String targetRef,
        String reason,
        String blacklistedByUsername,
        LocalDateTime blacklistedAt,
        boolean active) { }
