package lk.AccessOne.entry.web.dto;

import java.time.LocalDateTime;

public record AccessLogRow(
        Long id,
        String credentialType,
        String credentialRef,
        String holderName,
        String areaName,
        String direction,
        String decision,
        String denialReason,
        LocalDateTime accessTime) { }
