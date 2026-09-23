"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { http } from "@/lib/api";

export type EmployeeRow = {
  id: number;
  empId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nic: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  dateJoined: string;
  employmentStatus: "ACTIVE" | "RESIGNED" | "TERMINATED" | "RETIRED";
  photoPath?: string;
  username?: string;
  hasUserAccount: boolean;
};

export type EmployeeDetail = {
  id: number;
  empId: string;
  firstName: string;
  lastName: string;
  fullName: string;
  nic: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: number;
  departmentName: string;
  departmentCode: string;
  dateJoined: string;
  dateLeft?: string;
  employmentStatus: "ACTIVE" | "RESIGNED" | "TERMINATED" | "RETIRED";
  photoPath?: string;
  userId?: number;
  username?: string;
  role?: string;
  userActive: boolean;
  lastLoginAt?: string;
};

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

export type UpdateEmployeeInput = {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  designation: string;
  departmentId: number;
};

export type ProvisionedEmployeeResponse = {
  employeeId: number;
  empId: string;
  userId: number;
  username: string;
  temporaryPassword: string;
};

export type PageResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
};

export function useEmployees(params: {
  query?: string;
  departmentId?: number;
  status?: string;
  page?: number;
  size?: number;
}) {
  const q = new URLSearchParams();
  if (params.query) q.set("query", params.query);
  if (params.departmentId && params.departmentId > 0) q.set("departmentId", String(params.departmentId));
  if (params.status && params.status !== "ALL") q.set("status", params.status);
  q.set("page", String(params.page ?? 0));
  q.set("size", String(params.size ?? 15));

  return useQuery({
    queryKey: ["admin", "employees", params],
    queryFn: () => http.get<PageResponse<EmployeeRow>>(`/admin/employees?${q.toString()}`),
  });
}

export function useEmployee(id: number | null) {
  return useQuery({
    queryKey: ["admin", "employees", id],
    queryFn: () => http.get<EmployeeDetail>(`/admin/employees/${id}`),
    enabled: id !== null && id > 0,
  });
}

export function useProvisionEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: EmployeeProvisioningRequest) =>
      http.post<ProvisionedEmployeeResponse>("/admin/employees/provision", body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "employees"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "hr"] });
      qc.invalidateQueries({ queryKey: ["dashboard", "admin"] });
      qc.invalidateQueries({ queryKey: ["config", "departments"] });
    },
  });
}

export function useUpdateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }: UpdateEmployeeInput) =>
      http.put<EmployeeDetail>(`/admin/employees/${id}`, body),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "employees"] });
      qc.invalidateQueries({ queryKey: ["admin", "employees", vars.id] });
      qc.invalidateQueries({ queryKey: ["dashboard", "hr"] });
    },
  });
}

export function useSendEmployeeResetEmail() {
  return useMutation({
    mutationFn: (employeeId: number) =>
      http.post<void>(`/admin/employees/${employeeId}/send-reset-email`),
  });
}
