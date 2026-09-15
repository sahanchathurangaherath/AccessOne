"use client";

import Link from "next/link";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { ArrowLeft, Sparkles } from "lucide-react";
import { RequestForm } from "../../_components/RequestForm";

export default function NewRequestPage() {
  return (
    <RequireRole allow={["EMPLOYEE", "HR_MANAGER"]}>
      <div className="space-y-4">
        <Link
          href="/employee"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-credential transition-colors w-fit"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to My Requests</span>
        </Link>

        <PageHeader
          title="New Corporate ID Card Request"
          description="Create a draft request for your physical smart ID badge. You can review details and upload supporting documents before submitting for HR verification."
          actions={
            <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50/70 px-3 py-1 text-xs font-semibold text-credential shadow-2xs">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Draft Mode</span>
            </div>
          }
        />

        <RequestForm />
      </div>
    </RequireRole>
  );
}

