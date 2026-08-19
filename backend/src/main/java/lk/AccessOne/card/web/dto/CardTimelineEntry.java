package lk.AccessOne.card.web.dto;

import java.time.LocalDateTime;

public record CardTimelineEntry(
        String status, String changedBy, LocalDateTime changedAt, String note) { }
