package lk.AccessOne.entry.web.dto;

import java.time.LocalDateTime;

public record AccessResult(
        boolean granted,
        String denialReason,
        String holderName,
        String areaName,
        Long logId,
        LocalDateTime at) { }
