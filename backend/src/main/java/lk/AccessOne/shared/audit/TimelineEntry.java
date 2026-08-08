package lk.AccessOne.shared.audit;

import java.time.LocalDateTime;

public record TimelineEntry(String action, String status, String changedBy,
                            LocalDateTime changedAt, String note) { }
