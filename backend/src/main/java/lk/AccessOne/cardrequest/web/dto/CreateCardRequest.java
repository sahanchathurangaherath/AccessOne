package lk.AccessOne.cardrequest.web.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lk.AccessOne.shared.enums.RequestType;

public record CreateCardRequest(
        @NotNull RequestType requestType,
        @Size(max = 255) String reason,
        Long requestedAccessLevelId,
        Long previousCardId,
        Long employeeId) {        // HR only; ignored for an employee
}
