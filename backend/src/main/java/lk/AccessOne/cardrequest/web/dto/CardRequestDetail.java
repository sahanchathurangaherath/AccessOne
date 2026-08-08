package lk.AccessOne.cardrequest.web.dto;

import java.time.LocalDateTime;
import java.util.List;

public record CardRequestDetail(
        Long id, String requestNo, String requestType, String status,
        String reason, Long previousCardId,
        String employeeName, String empId, String designation, String departmentName,
        String accessLevelName, boolean hasPhoto,
        LocalDateTime submittedAt, LocalDateTime closedAt, LocalDateTime createdAt,
        boolean editable, boolean withdrawable, boolean deletable,
        List<DocumentSummary> documents) { }
