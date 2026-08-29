package lk.AccessOne.visitor.event;

import java.time.LocalDateTime;

/**
 * Notify the host, not the visitor -- the host is the accountable party,
 * the same reasoning that made host_employee_id mandatory when the pass
 * was issued.
 */
public record PassExpiringSoon(Long passId, Long hostEmployeeId, String visitorName, LocalDateTime validUntil) { }
