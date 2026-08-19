package lk.AccessOne.visitor.web.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.enums.IdDocumentType;
import lk.AccessOne.shared.enums.VisitorType;

public record RegisterVisitorInput(
        @NotBlank @Size(max = 120) String fullName,
        @NotNull IdDocumentType idDocumentType,
        @NotBlank @Size(max = 30) String idDocumentNo,
        @NotNull VisitorType visitorType,
        @NotNull Long hostEmployeeId,
        @Size(max = 120) String company,
        @Size(max = 20) String phone,
        @Email @Size(max = 120) String email) { }
