package lk.AccessOne.identity.web.dto;

public record ProvisionedEmployeeResponse(
        Long employeeId, String empId, Long userId, String username, String temporaryPassword) { }
