package lk.AccessOne.organisation.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record DepartmentInput(
        @NotBlank @Size(max = 10) String deptCode,
        @NotBlank @Size(max = 100) String deptName,
        @Size(max = 255) String description) { }
