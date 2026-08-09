package lk.AccessOne.access.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AccessLevelInput(
        @NotBlank @Size(max = 15) String levelCode,
        @NotBlank @Size(max = 80) String levelName,
        @Size(max = 255) String description) { }
