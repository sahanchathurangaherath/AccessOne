package lk.AccessOne.approval.web.dto;

import jakarta.validation.constraints.NotNull;
import lk.AccessOne.shared.enums.EmploymentStatus;

import java.time.LocalDate;

public record EmployeeExitRequest(@NotNull EmploymentStatus reason, @NotNull LocalDate exitDate) { }
