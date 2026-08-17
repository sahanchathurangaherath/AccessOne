package lk.AccessOne.card.web.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record CardSummary(
        Long id, String cardSerial, String status,
        String employeeName, String empId, String departmentName,
        LocalDate issueDate, LocalDateTime createdAt) { }
