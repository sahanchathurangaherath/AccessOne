package lk.AccessOne.approval.web.dto;

import java.util.List;

public record BulkResult(long successCount, long failureCount, List<BulkOutcome> outcomes) { }
