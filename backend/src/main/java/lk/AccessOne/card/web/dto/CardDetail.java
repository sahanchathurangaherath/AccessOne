package lk.AccessOne.card.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CardDetail(
        Long id, String cardSerial, String status, short versionNo, boolean usable,
        String empId, String printedName, String printedDesignation, String printedDepartment,
        String accessLevelName,
        LocalDate issueDate, LocalDateTime activatedAt,
        LocalDateTime revokedAt, String revocationReason,
        Long replacedByCardId, String replacedByCardSerial,
        String nfcFormat, String encodingAlgorithm, String nfcPayload,
        LocalDateTime credentialGeneratedAt,
        LocalDateTime createdAt) { }
