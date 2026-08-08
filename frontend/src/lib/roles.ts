import type { Role } from "@/lib/auth";

export const ROLE_HOME: Record<Role, string> = {
  EMPLOYEE:         "/employee",
  HR_MANAGER:       "/hr",
  IT_ADMIN:         "/it",
  SECURITY_OFFICER: "/security",
  PRINT_SUPERVISOR: "/print",
  SYSTEM_ADMIN:     "/admin",
};

export const ROLE_LABEL: Record<Role, string> = {
  EMPLOYEE:         "Employee",
  HR_MANAGER:       "HR Manager",
  IT_ADMIN:         "IT Administrator",
  SECURITY_OFFICER: "Security Officer",
  PRINT_SUPERVISOR: "Print Supervisor",
  SYSTEM_ADMIN:     "System Administrator",
};
