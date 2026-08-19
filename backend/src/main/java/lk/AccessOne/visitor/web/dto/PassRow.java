package lk.AccessOne.visitor.web.dto;

import java.time.LocalDateTime;

public record PassRow(
        Long id, String passNo, String visitorName, String visitorCode,
        String hostName, String status, LocalDateTime validFrom, LocalDateTime validUntil) { }
