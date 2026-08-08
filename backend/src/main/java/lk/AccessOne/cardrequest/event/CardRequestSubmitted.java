package lk.AccessOne.cardrequest.event;

/** Module 1 publishes this and does not need to know who listens. */
public record CardRequestSubmitted(Long requestId, Long employeeId) { }
