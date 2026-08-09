package lk.AccessOne.access.web.dto;

import jakarta.validation.constraints.NotNull;

public record AccessTestRequest(@NotNull Long levelId, @NotNull Long areaId) { }
