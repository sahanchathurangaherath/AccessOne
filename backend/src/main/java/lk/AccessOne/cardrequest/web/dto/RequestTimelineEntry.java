package lk.AccessOne.cardrequest.web.dto;

import java.time.LocalDateTime;

public record RequestTimelineEntry(
        String status, String changedBy, LocalDateTime changedAt, String note) { }
