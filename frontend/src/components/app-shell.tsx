"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, type Role } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { Button } from "@/components/ui/button";

type NavItem = { href: string; label: string; roles: Role[] };

const NAV: NavItem[] = [
  { href: "/employee", label: "My requests",    roles: ["EMPLOYEE"] },
  { href: "/hr",       label: "Approvals",      roles: ["HR_MANAGER"] },
  { href: "/hr/history", label: "Approval history", roles: ["HR_MANAGER"] },
  { href: "/it",       label: "Configuration",  roles: ["IT_ADMIN"] },
  { href: "/it/cards", label: "Cards",          roles: ["IT_ADMIN", "HR_MANAGER"] },
  { href: "/print",    label: "Production",     roles: ["PRINT_SUPERVISOR"] },
  { href: "/security", label: "Visitors",       roles: ["SECURITY_OFFICER"] },
  { href: "/security/access", label: "Access log", roles: ["SECURITY_OFFICER"] },
  { href: "/admin",    label: "Administration", roles: ["SYSTEM_ADMIN"] },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  if (!user) return null;

  const items = NAV.filter(
    (item) => item.roles.includes(user.role) || user.role === "SYSTEM_ADMIN"
  );

  return (
    <div className="min-h-screen">
      <header className="border-b border-rule bg-surface">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
          <Link href="/" className="identifier text-sm font-medium tracking-widest">
            ACCESSONE
          </Link>

          <nav aria-label="Main" className="flex flex-1 items-center gap-1">
            {items.map((item) => {
              const active = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`rounded-card px-3 py-1.5 text-sm transition-colors ${
                    active
                      ? "bg-credential/10 text-credential font-medium"
                      : "text-slate hover:bg-paper hover:text-ink"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-3">
            <div className="text-right leading-tight">
              <div className="text-sm font-medium">{user.username}</div>
              <div className="text-xs text-slate">{ROLE_LABEL[user.role]}</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8">{children}</main>
    </div>
  );
}
