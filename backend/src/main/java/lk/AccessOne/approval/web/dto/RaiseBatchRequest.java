package lk.AccessOne.approval.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import lk.AccessOne.cardrequest.web.dto.CreateCardRequest;

import java.util.List;

public record RaiseBatchRequest(@NotEmpty @Valid List<CreateCardRequest> requests) { }
