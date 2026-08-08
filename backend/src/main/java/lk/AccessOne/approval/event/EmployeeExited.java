package lk.AccessOne.approval.event;

import java.time.LocalDate;

/** Module 4 listens for this to revoke the employee's cards. */
public record EmployeeExited(Long employeeId, String reason, LocalDate exitDate) { }
