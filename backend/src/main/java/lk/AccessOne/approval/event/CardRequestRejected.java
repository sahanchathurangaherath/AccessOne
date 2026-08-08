package lk.AccessOne.approval.event;

public record CardRequestRejected(Long requestId, Long employeeId, String reason) { }
