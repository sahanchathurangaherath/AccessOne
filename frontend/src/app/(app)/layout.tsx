"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/app-shell";
import { FullPageSpinner } from "@/components/states";
import { SecOpsCopilotDrawer } from "@/components/ai/SecOpsCopilotDrawer";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) router.replace("/login");
  }, [isLoading, user, router]);

  if (isLoading) return <FullPageSpinner />;
  if (!user) return null;

  return (
    <AppShell>
      {children}
      <SecOpsCopilotDrawer />
    </AppShell>
  );
}
