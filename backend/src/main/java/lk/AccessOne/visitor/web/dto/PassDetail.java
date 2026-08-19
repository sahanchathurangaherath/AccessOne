package lk.AccessOne.visitor.web.dto;

import java.time.LocalDateTime;

public record PassDetail(
        Long id, String passNo,
        Long visitorId, String visitorName, String visitorCode,
        Long hostEmployeeId, String hostName, String hostEmpId,
        Long accessLevelId, String accessLevelName,
        String purpose, LocalDateTime validFrom, LocalDateTime validUntil,
        String status, String cancelledReason,
        LocalDateTime issuedAt, String issuedByUsername, LocalDateTime createdAt) { }
