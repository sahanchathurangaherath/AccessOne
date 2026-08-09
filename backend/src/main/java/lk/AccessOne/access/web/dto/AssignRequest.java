package lk.AccessOne.access.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record AssignRequest(@NotNull Long levelId, @Size(max = 255) String remarks) { }
