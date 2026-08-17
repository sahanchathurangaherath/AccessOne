package lk.AccessOne.print.web.dto;

import jakarta.validation.constraints.NotNull;

public record QueueJobRequest(@NotNull Long cardId) { }
