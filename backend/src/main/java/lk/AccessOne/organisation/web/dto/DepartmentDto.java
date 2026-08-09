package lk.AccessOne.organisation.web.dto;

public record DepartmentDto(Long id, String deptCode, String deptName,
                            String description, boolean active,
                            long employeeCount, boolean deletable) { }
