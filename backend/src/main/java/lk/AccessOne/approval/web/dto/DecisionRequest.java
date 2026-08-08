package lk.AccessOne.approval.web.dto;

import jakarta.validation.constraints.Size;

public record DecisionRequest(@Size(max = 500) String reason) { }
