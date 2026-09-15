"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { RequireRole } from "@/components/require-role";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useDepartments } from "@/app/(app)/it/_hooks/useConfig";
import {
  useProvisionEmployee,
  type ProvisionedEmployeeResponse,
} from "../_hooks/useEmployeeProvisioning";
import { ApiError } from "@/lib/api";
import {
  UserPlus,
  ShieldCheck,
  Building2,
  Copy,
  Check,
  AlertCircle,
  KeyRound,
  IdCard,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  Sparkles,
  Info,
} from "lucide-react";

const schema = z.object({
  empId: z
    .string()
    .min(2, "Employee ID must be at least 2 characters")
    .max(20, "Employee ID cannot exceed 20 characters")
    .regex(/^[A-Za-z0-9-_]+$/, "Employee ID may only contain letters, numbers, hyphens, and underscores"),
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  nic: z.string().min(9, "NIC must be at least 9 characters").max(20),
  email: z.string().email("Please enter a valid email address").max(120),
  phone: z.string().max(20).optional().or(z.literal("")),
  designation: z.string().min(2, "Designation is required").max(100),
  departmentId: z.number().min(1, "Please select a department"),
  dateJoined: z.string().min(1, "Date joined is required"),
});

type FormValues = z.infer<typeof schema>;

export default function EmployeeProvisioningPage() {
  const { data: departments, isLoading: deptsLoading } = useDepartments();
  const provision = useProvisionEmployee();

  const [provisionedData, setProvisionedData] = useState<ProvisionedEmployeeResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      empId: "",
      firstName: "",
      lastName: "",
      nic: "",
      email: "",
      phone: "",
      designation: "",
      departmentId: 0,
      dateJoined: today,
    },
  });

  async function onSubmit(values: FormValues) {
    setFormError(null);
    try {
      const response = await provision.mutateAsync({
        ...values,
        phone: values.phone || undefined,
      });

      setProvisionedData(response);
      toast.success(`Employee ${values.empId} provisioned successfully!`);
      form.reset({
        empId: "",
        firstName: "",
        lastName: "",
        nic: "",
        email: "",
        phone: "",
        designation: "",
        departmentId: 0,
        dateJoined: today,
      });
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.problem.detail || error.problem.title || "Failed to provision employee");
      } else {
        setFormError("An unexpected error occurred. Please try again.");
      }
    }
  }

  function handleCopy(text: string, fieldName: string) {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    toast.success(`${fieldName} copied to clipboard`);
    setTimeout(() => setCopiedField(null), 2000);
  }

  function handleCopyAll() {
    if (!provisionedData) return;
    const summary = `AccessOne Account Credentials:\nUsername: ${provisionedData.username}\nTemporary Password: ${provisionedData.temporaryPassword}\nEmployee ID: ${provisionedData.empId}\nLogin URL: http://localhost:3000/login`;
    navigator.clipboard.writeText(summary);
    toast.success("Account details copied to clipboard");
  }

  const activeDepartments = departments?.filter((d) => d.active) || [];

  return (
    <RequireRole allow={["HR_MANAGER", "SYSTEM_ADMIN"]}>
      <PageHeader
        title="Employee Onboarding & Provisioning"
        description="Register authoritative employee records and automatically generate initial login credentials for the AccessOne portal."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="surface-panel p-6 sm:p-8 rounded-2xl border border-rule bg-surface shadow-xs">
            <div className="flex items-center gap-3 pb-6 border-b border-rule mb-6">
              <div className="h-10 w-10 rounded-xl bg-credential/10 text-credential flex items-center justify-center">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-ink">New Employee Record</h2>
                <p className="text-xs text-slate">
                  Fill in official personnel details to issue their digital profile
                </p>
              </div>
            </div>

            {formError && (
              <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-800 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Provisioning Error</p>
                  <p className="mt-0.5">{formError}</p>
                </div>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
              {/* Row 1: Employee ID & NIC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="empId" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <IdCard className="h-3.5 w-3.5 text-slate-400" />
                    Employee ID <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="empId"
                    placeholder="e.g. EMP0023"
                    className="h-10 rounded-xl text-sm"
                    {...form.register("empId")}
                  />
                  {form.formState.errors.empId && (
                    <p className="text-xs text-red-600 font-medium">
                      {form.formState.errors.empId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nic" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    National ID (NIC) <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="nic"
                    placeholder="e.g. 199512345678V"
                    className="h-10 rounded-xl text-sm"
                    {...form.register("nic")}
                  />
                  {form.formState.errors.nic && (
                    <p className="text-xs text-red-600 font-medium">
                      {form.formState.errors.nic.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 2: First Name & Last Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName" className="text-xs font-semibold text-ink">
                    First Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="firstName"
                    placeholder="e.g. Kasun"
                    className="h-10 rounded-xl text-sm"
                    {...form.register("firstName")}
                  />
                  {form.formState.errors.firstName && (
                    <p className="text-xs text-red-600 font-medium">
                      {form.formState.errors.firstName.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="lastName" className="text-xs font-semibold text-ink">
                    Last Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="lastName"
                    placeholder="e.g. Perera"
                    className="h-10 rounded-xl text-sm"
                    {...form.register("lastName")}
                  />
                  {form.formState.errors.lastName && (
                    <p className="text-xs text-red-600 font-medium">
                      {form.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 3: Email & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="email" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    Corporate Email <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="e.g. kasun.p@accessone.lk"
                    className="h-10 rounded-xl text-sm"
                    {...form.register("email")}
                  />
                  {form.formState.errors.email && (
                    <p className="text-xs text-red-600 font-medium">
                      {form.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="phone" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    placeholder="e.g. +94771234567"
                    className="h-10 rounded-xl text-sm"
                    {...form.register("phone")}
                  />
                  {form.formState.errors.phone && (
                    <p className="text-xs text-red-600 font-medium">
                      {form.formState.errors.phone.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 4: Department & Designation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="departmentId" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 text-slate-400" />
                    Department <span className="text-red-500">*</span>
                  </Label>
                  <select
                    id="departmentId"
                    className="w-full h-10 px-3 rounded-xl border border-rule bg-surface text-sm text-ink focus:outline-none focus:border-credential"
                    disabled={deptsLoading}
                    {...form.register("departmentId", { valueAsNumber: true })}
                  >
                    <option value="0">Select department...</option>
                    {activeDepartments.map((dept) => (
                      <option key={dept.id} value={dept.id}>
                        {dept.deptName} ({dept.deptCode})
                      </option>
                    ))}
                  </select>
                  {form.formState.errors.departmentId && (
                    <p className="text-xs text-red-600 font-medium">
                      {form.formState.errors.departmentId.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="designation" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                    Designation <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="designation"
                    placeholder="e.g. Software Engineer"
                    className="h-10 rounded-xl text-sm"
                    {...form.register("designation")}
                  />
                  {form.formState.errors.designation && (
                    <p className="text-xs text-red-600 font-medium">
                      {form.formState.errors.designation.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Row 5: Date Joined */}
              <div className="space-y-1.5 max-w-sm">
                <Label htmlFor="dateJoined" className="text-xs font-semibold text-ink flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  Date Joined <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="dateJoined"
                  type="date"
                  className="h-10 rounded-xl text-sm"
                  {...form.register("dateJoined")}
                />
                {form.formState.errors.dateJoined && (
                  <p className="text-xs text-red-600 font-medium">
                    {form.formState.errors.dateJoined.message}
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-rule flex items-center justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-xl text-xs h-10 px-5"
                  onClick={() => form.reset()}
                  disabled={provision.isPending}
                >
                  Reset Form
                </Button>
                <Button
                  type="submit"
                  className="rounded-xl text-xs font-semibold h-10 px-6 bg-credential hover:bg-credential/90 text-white shadow-xs"
                  disabled={provision.isPending}
                >
                  {provision.isPending ? "Provisioning..." : "Provision Employee"}
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right 1 Col: Explanations & Info */}
        <div className="space-y-6">
          <div className="surface-panel p-6 rounded-2xl border border-rule bg-surface shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 text-credential">
              <Sparkles className="h-5 w-5" />
              <h3 className="text-sm font-bold text-ink">How Provisioning Works</h3>
            </div>
            <p className="text-xs leading-relaxed text-slate">
              In AccessOne, employee identities are created through authorized HR provisioning:
            </p>
            <ul className="space-y-3 text-xs text-slate">
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 rounded-full bg-blue-50 text-credential font-bold items-center justify-center text-[10px] shrink-0 mt-0.5">
                  1
                </span>
                <span>
                  <strong className="text-ink">Authoritative Record:</strong> Creates verified employee identity in the organization database.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 rounded-full bg-blue-50 text-credential font-bold items-center justify-center text-[10px] shrink-0 mt-0.5">
                  2
                </span>
                <span>
                  <strong className="text-ink">Auto System User:</strong> Automatically generates user account with <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">ROLE_EMPLOYEE</code>.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 rounded-full bg-blue-50 text-credential font-bold items-center justify-center text-[10px] shrink-0 mt-0.5">
                  3
                </span>
                <span>
                  <strong className="text-ink">Temporary Password:</strong> Secure 12-char random alphanumeric password is generated for initial login.
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 rounded-full bg-blue-50 text-credential font-bold items-center justify-center text-[10px] shrink-0 mt-0.5">
                  4
                </span>
                <span>
                  <strong className="text-ink">Card Issuance:</strong> Once the employee logs in, they submit their photo & badge request in <code className="bg-slate-100 px-1 py-0.5 rounded text-[11px]">/employee</code>.
                </span>
              </li>
            </ul>
          </div>

          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 text-xs text-blue-900 space-y-2">
            <div className="flex items-center gap-2 font-semibold text-blue-950">
              <Info className="h-4 w-4 text-blue-600" />
              <span>Password Security Notice</span>
            </div>
            <p className="leading-relaxed text-blue-800/90 text-[11px]">
              Temporary passwords are encrypted with BCrypt immediately upon creation and shown only once. The employee will be required to update it when logging in.
            </p>
          </div>
        </div>
      </div>

      {/* Success Modal / Credentials Dialog */}
      <Dialog open={!!provisionedData} onOpenChange={(open) => !open && setProvisionedData(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mb-2">
              <Check className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center text-lg font-bold text-ink">
              Employee Provisioned Successfully!
            </DialogTitle>
            <DialogDescription className="text-center text-xs text-slate">
              Please provide these initial login credentials securely to the employee.
            </DialogDescription>
          </DialogHeader>

          {provisionedData && (
            <div className="space-y-4 my-2">
              <div className="rounded-xl border border-rule bg-slate-50/70 p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-rule/60">
                  <span className="text-slate font-medium">Employee ID:</span>
                  <span className="font-bold text-ink identifier">{provisionedData.empId}</span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-rule/60">
                  <span className="text-slate font-medium">Username:</span>
                  <div className="flex items-center gap-2">
                    <code className="font-bold text-credential identifier bg-blue-50 px-2 py-0.5 rounded">
                      {provisionedData.username}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(provisionedData.username, "Username")}
                      className="text-slate-400 hover:text-ink transition-colors p-1"
                      title="Copy username"
                    >
                      {copiedField === "Username" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate font-medium">Temporary Password:</span>
                  <div className="flex items-center gap-2">
                    <code className="font-bold text-emerald-700 identifier bg-emerald-50 px-2 py-0.5 rounded tracking-wider">
                      {provisionedData.temporaryPassword}
                    </code>
                    <button
                      type="button"
                      onClick={() => handleCopy(provisionedData.temporaryPassword, "Password")}
                      className="text-slate-400 hover:text-ink transition-colors p-1"
                      title="Copy password"
                    >
                      {copiedField === "Password" ? (
                        <Check className="h-3.5 w-3.5 text-emerald-600" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                <KeyRound className="h-4 w-4 text-amber-600 shrink-0" />
                <span>This temporary password will not be shown again.</span>
              </div>
            </div>
          )}

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto text-xs h-9 rounded-xl flex items-center justify-center gap-1.5"
              onClick={handleCopyAll}
            >
              <Copy className="h-3.5 w-3.5" />
              Copy Credentials
            </Button>
            <Button
              type="button"
              className="w-full sm:w-auto text-xs h-9 rounded-xl bg-credential text-white hover:bg-credential/90"
              onClick={() => setProvisionedData(null)}
            >
              Done / Onboard Next
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}
