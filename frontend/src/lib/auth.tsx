"use client";

import { createContext, useContext, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { http, ApiError } from "@/lib/api";

export type Role =
  | "EMPLOYEE" | "HR_MANAGER" | "IT_ADMIN"
  | "SECURITY_OFFICER" | "PRINT_SUPERVISOR" | "SYSTEM_ADMIN";

export type CurrentUser = {
  userId: number;
  username: string;
  employeeId: number | null;
  role: Role;
  permissions: string[];
};

type AuthValue = {
  user: CurrentUser | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<CurrentUser>;
  logout: () => Promise<void>;
  can: (permission: string) => boolean;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  // Seed the XSRF-TOKEN cookie before any state-changing request is possible.
  useEffect(() => {
    void http.get("/auth/csrf").catch(() => {});
  }, []);

  const { data: user, isLoading } = useQuery({
    queryKey: ["auth", "me"],
    // A 401 here is the normal "not logged in" case, not an error — swallow
    // it and resolve to null instead of letting the query settle as failed.
    queryFn: () =>
      http.get<CurrentUser>("/auth/me").catch((error) => {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }),
    retry: false,
    staleTime: Infinity,
  });

  const loginMutation = useMutation({
    mutationFn: (vars: { username: string; password: string }) =>
      http.post<CurrentUser>("/auth/login", vars),
    onSuccess: (data) => queryClient.setQueryData(["auth", "me"], data),
  });

  const logoutMutation = useMutation({
    mutationFn: () => http.post<void>("/auth/logout"),
    onSuccess: () => {
      queryClient.clear();
      router.replace("/login");
    },
  });

  const value: AuthValue = {
    user: user ?? null,
    isLoading,
    login: async (username, password) =>
      loginMutation.mutateAsync({ username, password }),
    logout: async () => { await logoutMutation.mutateAsync(); },
    can: (permission) => user?.permissions.includes(permission) ?? false,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
