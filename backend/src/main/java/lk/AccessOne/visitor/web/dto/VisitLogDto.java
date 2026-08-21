package lk.AccessOne.visitor.web.dto;

import java.time.LocalDateTime;

public record VisitLogDto(
        Long id, Long passId, String passNo, String visitorName,
        String entryAreaName, LocalDateTime checkInAt, LocalDateTime checkOutAt,
        String remarks) { }
