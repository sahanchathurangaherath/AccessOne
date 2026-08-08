package lk.AccessOne.approval.web.dto;

import jakarta.validation.constraints.NotEmpty;

import java.util.List;

public record BulkApproveRequest(@NotEmpty List<Long> requestIds) { }
