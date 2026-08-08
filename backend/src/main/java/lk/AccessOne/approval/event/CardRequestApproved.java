package lk.AccessOne.approval.event;

/** Module 4 listens for this to generate a card. Module 2 does not know or care that it exists. */
public record CardRequestApproved(Long requestId, Long employeeId, Long accessLevelId) { }
