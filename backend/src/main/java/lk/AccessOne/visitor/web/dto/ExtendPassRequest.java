package lk.AccessOne.visitor.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;

public record ExtendPassRequest(
        @NotNull LocalDateTime newUntil,
        @NotBlank @Size(max = 255) String reason) { }
