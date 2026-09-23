"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth, type Role } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { NotificationBell } from "@/components/notification-bell";
import {
  CreditCard,
  CheckCircle,
  Building2,
  Printer,
  ShieldCheck,
  History,
  Users,
  Key,
  FileText,
  Send,
  BarChart2,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  LogOut,
  Shield,
  SlidersHorizontal,
  IdCard,
  User,
} from "lucide-react";

type NavItem = {
  href: string;
  label: string;
  roles: Role[];
  icon: React.ReactNode;
};

type NavGroup = {
  title: string;
  items: NavItem[];
};

const NAV_GROUPS: NavGroup[] = [
  {
    title: "Employee",
    items: [
      { href: "/employee", label: "My Requests", roles: ["EMPLOYEE"], icon: <FileText className="h-4 w-4" /> },
    ],
  },
  {
    title: "HR Approvals",
    items: [
      { href: "/hr", label: "Approval Queue", roles: ["HR_MANAGER"], icon: <CheckCircle className="h-4 w-4" /> },
      { href: "/hr/history", label: "Approval History", roles: ["HR_MANAGER"], icon: <History className="h-4 w-4" /> },
      { href: "/hr/employees", label: "Employee Onboarding", roles: ["HR_MANAGER", "SYSTEM_ADMIN"], icon: <Users className="h-4 w-4" /> },
    ],
  },
  {
    title: "Access & Infrastructure",
    items: [
      { href: "/it", label: "Configuration", roles: ["IT_ADMIN"], icon: <SlidersHorizontal className="h-4 w-4" /> },
      { href: "/it/departments", label: "Departments", roles: ["IT_ADMIN"], icon: <Building2 className="h-4 w-4" /> },
      { href: "/it/areas", label: "Security Areas", roles: ["IT_ADMIN"], icon: <Key className="h-4 w-4" /> },
      { href: "/it/access-levels", label: "Access Levels", roles: ["IT_ADMIN"], icon: <Shield className="h-4 w-4" /> },
      { href: "/it/cards", label: "Card Directory", roles: ["IT_ADMIN", "HR_MANAGER"], icon: <IdCard className="h-4 w-4" /> },
    ],
  },
  {
    title: "Print Production",
    items: [
      { href: "/print", label: "Production Queue", roles: ["PRINT_SUPERVISOR"], icon: <Printer className="h-4 w-4" /> },
      { href: "/print/dispatch", label: "Dispatch & Handover", roles: ["PRINT_SUPERVISOR"], icon: <Send className="h-4 w-4" /> },
      { href: "/print/reports", label: "Production Reports", roles: ["PRINT_SUPERVISOR"], icon: <BarChart2 className="h-4 w-4" /> },
    ],
  },
  {
    title: "Security & Visitors",
    items: [
      { href: "/security", label: "On-Site Activity", roles: ["SECURITY_OFFICER"], icon: <ShieldCheck className="h-4 w-4" /> },
      { href: "/security/visitors", label: "Visitor Register", roles: ["SECURITY_OFFICER"], icon: <Users className="h-4 w-4" /> },
      { href: "/security/passes", label: "Temporary Passes", roles: ["SECURITY_OFFICER"], icon: <CreditCard className="h-4 w-4" /> },
      { href: "/security/access", label: "Access Event Log", roles: ["SECURITY_OFFICER"], icon: <History className="h-4 w-4" /> },
    ],
  },
  {
    title: "System Administration",
    items: [
      { href: "/admin", label: "Admin Dashboard", roles: ["SYSTEM_ADMIN"], icon: <Shield className="h-4 w-4" /> },
      { href: "/hr/employees", label: "User Accounts", roles: ["SYSTEM_ADMIN"], icon: <Users className="h-4 w-4" /> },
      { href: "/admin/audit", label: "Audit Log", roles: ["SYSTEM_ADMIN"], icon: <FileText className="h-4 w-4" /> },
    ],
  },
];

function getPageHeading(pathname: string): { title: string; subtitle?: string } {
  if (pathname === "/employee") return { title: "Employee Card Portal", subtitle: "Submit and track ID card requests" };
  if (pathname.startsWith("/employee/requests/new")) return { title: "New Card Request", subtitle: "Submit identification details" };
  if (pathname.startsWith("/employee/requests/")) return { title: "Request Details", subtitle: "Review card issuance status" };
  if (pathname === "/hr") return { title: "HR Approval Queue", subtitle: "Review employee card verification requests" };
  if (pathname === "/hr/history") return { title: "HR Approval History", subtitle: "Log of verified and resolved requests" };
  if (pathname === "/hr/employees") return { title: "Employee Onboarding & Provisioning", subtitle: "Register new employees and generate system credentials" };
  if (pathname === "/it") return { title: "IT Access Management", subtitle: "Configure rules and manage issued credentials" };
  if (pathname === "/it/departments") return { title: "Departments", subtitle: "Department hierarchy and assignments" };
  if (pathname === "/it/areas") return { title: "Security Areas", subtitle: "Physical zones and access control points" };
  if (pathname === "/it/access-levels") return { title: "Access Levels", subtitle: "Configure permission matrices and privileges" };
  if (pathname === "/it/cards") return { title: "Card Directory", subtitle: "Active, printed, and revoked credentials" };
  if (pathname === "/print") return { title: "Print Production Queue", subtitle: "Batch print processing for approved cards" };
  if (pathname === "/print/dispatch") return { title: "Card Dispatch", subtitle: "Handover and activation tracking" };
  if (pathname === "/print/reports") return { title: "Production Reports", subtitle: "Print volume and yield metrics" };
  if (pathname === "/security") return { title: "Security Operations", subtitle: "Live on-site occupancy and verification" };
  if (pathname === "/security/visitors") return { title: "Visitor Register", subtitle: "Manage guest check-ins and check-outs" };
  if (pathname === "/security/passes") return { title: "Temporary Passes", subtitle: "Issue and revoke visitor badges" };
  if (pathname === "/security/access") return { title: "Access Decision Log", subtitle: "Real-time door sensor events and audits" };
  if (pathname === "/admin") return { title: "System Administration", subtitle: "System health, roles, and configuration" };
  if (pathname === "/admin/audit") return { title: "System Audit Trail", subtitle: "Comprehensive immutable event log" };
  return { title: "AccessOne", subtitle: "Corporate ID & Access Management" };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  // Filter groups and items based on role
  let visibleGroups = NAV_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => {
      // Personal self-service requests are only relevant for employees with a linked employee profile
      if (item.href === "/employee") {
        return user.role === "EMPLOYEE" || Boolean(user.employeeId);
      }
      // Avoid duplicate User Accounts item under HR Approvals for System Admin
      if (group.title === "HR Approvals" && item.href === "/hr/employees" && user.role === "SYSTEM_ADMIN") {
        return false;
      }
      return item.roles.includes(user.role) || user.role === "SYSTEM_ADMIN";
    }),
  })).filter((group) => group.items.length > 0);

  // For SYSTEM_ADMIN, move "System Administration" to the very top of the sidebar for immediate re-entry
  if (user.role === "SYSTEM_ADMIN") {
    const adminIdx = visibleGroups.findIndex((g) => g.title === "System Administration");
    if (adminIdx > 0) {
      const [adminGroup] = visibleGroups.splice(adminIdx, 1);
      visibleGroups = [adminGroup, ...visibleGroups];
    }
  }

  const isActive = (href: string) => {
    if (href === "/employee" || href === "/hr" || href === "/it" || href === "/print" || href === "/security" || href === "/admin") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  const pageHeading = getPageHeading(pathname);

  const sidebarContent = (
    <div className="flex h-full flex-col bg-surface">
      {/* Brand Header */}
      <div
        className={cn(
          "flex h-16 items-center gap-3 border-b border-rule px-4 transition-all",
          collapsed ? "justify-center px-2" : "justify-between"
        )}
      >
        <Link href="/" className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-credential text-white shadow-xs">
            <ShieldCheck className="h-6 w-6" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="identifier text-base font-bold tracking-wider text-ink">
                ACCESSONE
              </span>
              <span className="text-xs font-medium text-slate-500">
                ID & Access Control
              </span>
            </div>
          )}
        </Link>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
        {visibleGroups.map((group) => (
          <div key={group.title} className="space-y-1.5">
            {!collapsed && (
              <p className="px-3 text-xs font-bold uppercase tracking-wider text-slate-400">
                {group.title}
              </p>
            )}
            {group.items.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  title={collapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3.5 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-blue-50/90 text-credential font-bold shadow-xs"
                      : "text-slate-600 hover:bg-slate-50 hover:text-ink",
                    collapsed && "justify-center px-2 py-3"
                  )}
                >
                  <span
                    className={cn(
                      "flex h-5 w-5 flex-shrink-0 items-center justify-center text-slate-500 transition-colors [&>svg]:h-5 [&>svg]:w-5",
                      active && "text-credential"
                    )}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* User Footer & Collapse Button */}
      <div
        className={cn(
          "border-t border-rule p-3.5 transition-all",
          collapsed ? "flex flex-col items-center gap-3" : "flex items-center justify-between gap-2.5"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-bold text-slate-700 border border-slate-200">
            {getInitials(user.username)}
          </div>
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-ink leading-tight">
                {user.username}
              </p>
              <p className="truncate text-xs text-slate-500 font-medium mt-0.5">
                {ROLE_LABEL[user.role]}
              </p>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "hidden lg:flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors",
            collapsed ? "" : "ml-auto"
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="h-4.5 w-4.5" />
          ) : (
            <ChevronLeft className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-paper text-ink">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          "hidden lg:flex flex-col flex-shrink-0 border-r border-rule bg-surface shadow-xs transition-all duration-300",
          collapsed ? "w-18" : "w-64"
        )}
      >
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-xs lg:hidden animate-fade-in"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 border-r border-rule bg-surface shadow-panel lg:hidden animate-slide-in-right">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-2 rounded-lg text-slate hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent}
          </aside>
        </>
      )}

      {/* Main Workspace Column */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        {/* Topbar */}
        <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-rule bg-surface/90 px-4 sm:px-6 shadow-xs backdrop-blur">
          <div className="flex items-center gap-3.5">
            <button
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate hover:bg-slate-100 lg:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-ink">
                {pageHeading.title}
              </h1>
              {pageHeading.subtitle && (
                <p className="hidden sm:block text-xs sm:text-sm text-slate-500 font-normal">
                  {pageHeading.subtitle}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            {user.role === "SYSTEM_ADMIN" && pathname !== "/admin" && (
              <Link
                href="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl border border-blue-200 bg-blue-50/80 px-3 py-1.5 text-xs font-bold text-credential hover:bg-blue-100 transition-colors shadow-2xs"
                title="Return to System Administration Dashboard"
              >
                <Shield className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Admin Dashboard</span>
              </Link>
            )}
            <NotificationBell />
            <div className="h-6 w-px bg-rule hidden sm:block" />
            
            {/* Topbar User Profile Avatar Widget */}
            <div className="hidden sm:flex items-center gap-2.5 rounded-xl border border-rule/80 bg-slate-50/70 py-1 pl-3 pr-1.5 shadow-2xs">
              <div className="flex flex-col text-right leading-tight">
                <span className="text-xs font-bold text-ink truncate max-w-[140px]">{user.username}</span>
                <span className="text-[10px] font-semibold text-slate-500">{ROLE_LABEL[user.role]}</span>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-[#1F4B8E] to-blue-700 text-white shadow-xs font-bold text-xs ring-1 ring-white/50 select-none">
                {getInitials(user.username)}
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => void logout()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-sm font-semibold text-slate-700 shadow-2xs hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700 transition-all cursor-pointer h-9"
              aria-label="Sign out of system"
            >
              <LogOut className="h-4.5 w-4.5 text-slate-500 group-hover:text-rose-600 transition-colors" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </header>

        {/* Scrollable Main Content */}
        <main className="flex-1 overflow-y-auto min-h-0 flex flex-col">
          <div className="page-shell w-full min-h-0 flex-1 flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
