package lk.AccessOne.visitor.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record UpdateVisitorInput(
        @NotBlank @Size(max = 120) String fullName,
        @Size(max = 120) String company,
        @Size(max = 20) String phone,
        @Email @Size(max = 120) String email,
        @NotNull Long hostEmployeeId) { }
