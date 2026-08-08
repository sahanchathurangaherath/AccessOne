package lk.AccessOne.approval.web.dto;

import java.time.LocalDateTime;

public record ApprovalTimelineEntry(String status, String changedBy, LocalDateTime changedAt, String note) { }
