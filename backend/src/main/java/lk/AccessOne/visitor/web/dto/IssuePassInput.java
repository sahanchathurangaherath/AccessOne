package lk.AccessOne.visitor.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record IssuePassInput(
        @NotNull Long visitorId,
        @NotNull Long hostEmployeeId,
        @NotNull Long accessLevelId,
        @NotBlank @Size(max = 255) String purpose,
        @NotNull LocalDateTime validFrom,
        @NotNull LocalDateTime validUntil) { }
