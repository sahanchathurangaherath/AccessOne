"use client";

import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const SECTIONS = [
  { href: "/it/departments", title: "Departments",
    description: "Organisational units employees belong to." },
  { href: "/it/areas", title: "Areas",
    description: "Physical spaces access levels can grant entry to." },
  { href: "/it/access-levels", title: "Access levels",
    description: "The permission matrix, and a rule test to check what a level grants without needing a card." },
];

export default function ItDashboard() {
  return (
    <RequireRole allow={["IT_ADMIN"]}>
      <PageHeader
        title="Configuration"
        description="Manage departments, areas and access levels."
      />
      <div className="grid gap-4 sm:grid-cols-3">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href}>
            <Card className="h-full transition-colors hover:bg-paper">
              <CardHeader>
                <CardTitle>{s.title}</CardTitle>
                <CardDescription>{s.description}</CardDescription>
              </CardHeader>
              <CardContent />
            </Card>
          </Link>
        ))}
      </div>
    </RequireRole>
  );
}
