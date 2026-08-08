"use client";

import { useAuth, type Role } from "@/lib/auth";
import { NotAuthorised } from "@/components/states";

export function RequireRole({
  allow,
  children,
}: {
  allow: Role[];
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  if (!user) return null;
  if (!allow.includes(user.role) && user.role !== "SYSTEM_ADMIN") {
    return <NotAuthorised />;
  }
  return <>{children}</>;
}
