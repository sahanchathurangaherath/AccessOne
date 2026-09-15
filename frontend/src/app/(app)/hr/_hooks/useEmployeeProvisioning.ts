"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";

export type EmployeeProvisioningRequest = {
  empId: string;
  firstName: string;
  lastName: string;
  nic: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: number;
  dateJoined: string;
};

export type ProvisionedEmployeeResponse = {
  employeeId: number;
  empId: string;
  userId: number;
  username: string;
  temporaryPassword: string;
};

export function useProvisionEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmployeeProvisioningRequest) =>
      http.post<ProvisionedEmployeeResponse>("/admin/employees/provision", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dashboard", "hr"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "admin"] });
      qc.invalidateQueries({ queryKey: ["config", "departments"] });
    },
  });
}
