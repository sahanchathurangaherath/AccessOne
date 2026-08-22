package lk.AccessOne.entry.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lk.AccessOne.shared.enums.Direction;

public record EvaluateRequest(
        @NotBlank String credentialRef,
        @NotBlank String areaCode,
        @NotNull Direction direction) { }
