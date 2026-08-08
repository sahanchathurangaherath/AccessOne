package lk.AccessOne.approval.web.dto;

public record BulkOutcome(Long requestId, boolean success, String message) {
    public static BulkOutcome ok(Long requestId) {
        return new BulkOutcome(requestId, true, null);
    }

    public static BulkOutcome failed(Long requestId, String message) {
        return new BulkOutcome(requestId, false, message);
    }
}
