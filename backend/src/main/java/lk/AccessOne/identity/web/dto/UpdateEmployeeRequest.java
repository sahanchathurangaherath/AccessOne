package lk.AccessOne.identity.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateEmployeeRequest(
        @NotBlank @Size(max = 60) String firstName,
        @NotBlank @Size(max = 60) String lastName,
        @Email @NotBlank @Size(max = 120) String email,
        @Size(max = 20) String phone,
        @NotBlank @Size(max = 100) String designation,
        @NotNull Long departmentId
) {}
