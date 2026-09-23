package lk.AccessOne.identity.web.dto;

import lk.AccessOne.shared.enums.EmploymentStatus;

import java.time.LocalDate;

public record EmployeeRowDto(
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
        EmploymentStatus employmentStatus,
        String photoPath,
        String username,
        boolean hasUserAccount
) {}
