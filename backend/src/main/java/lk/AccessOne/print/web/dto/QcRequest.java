package lk.AccessOne.print.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.enums.QcResult;

public record QcRequest(@NotNull QcResult result, @Size(max = 255) String notes) { }
