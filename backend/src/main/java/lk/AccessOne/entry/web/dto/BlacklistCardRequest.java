package lk.AccessOne.entry.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record BlacklistCardRequest(
        @NotNull Long cardId,
        @NotBlank @Size(max = 255) String reason) { }
