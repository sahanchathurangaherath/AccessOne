package lk.AccessOne.identity.web.dto;

import lk.AccessOne.shared.enums.EmploymentStatus;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record EmployeeDetailDto(
        Long id,
        String empId,
        String firstName,
        String lastName,
        String fullName,
        String nic,
        String email,
        String phone,
        String designation,
        Long departmentId,
        String departmentName,
        String departmentCode,
        LocalDate dateJoined,
        LocalDate dateLeft,
        EmploymentStatus employmentStatus,
        String photoPath,
        Long userId,
        String username,
        String role,
        boolean userActive,
        LocalDateTime lastLoginAt
) {}
