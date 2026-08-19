package lk.AccessOne.print.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.enums.DispatchMethod;

public record OpenDispatchRequest(
        @NotNull Long printJobId, @NotNull DispatchMethod dispatchMethod,
        @Size(max = 255) String remarks) { }
