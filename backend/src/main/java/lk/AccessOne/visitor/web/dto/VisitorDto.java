package lk.AccessOne.visitor.web.dto;

import java.time.LocalDateTime;

public record VisitorDto(
        Long id, String visitorCode, String fullName,
        String idDocumentNo, String idDocumentType,
        String company, String phone, String email, String visitorType,
        Long hostEmployeeId, String hostEmployeeName, String hostEmpId,
        boolean hasPhoto, boolean deleted, LocalDateTime createdAt) { }
