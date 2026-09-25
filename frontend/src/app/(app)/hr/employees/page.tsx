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
  useEmployees,
  useProvisionEmployee,
  useUpdateEmployee,
  useSendEmployeeResetEmail,
  type EmployeeRow,
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
  Users,
  Search,
  Edit2,
  Send,
  Loader2,
  RefreshCw,
  User,
} from "lucide-react";

// ─── Schemas ───
const provisionSchema = z.object({
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

const updateSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(60),
  lastName: z.string().min(1, "Last name is required").max(60),
  email: z.string().email("Please enter a valid email address").max(120),
  phone: z.string().max(20).optional().or(z.literal("")),
  designation: z.string().min(2, "Designation is required").max(100),
  departmentId: z.number().min(1, "Please select a department"),
});

type ProvisionFormValues = z.infer<typeof provisionSchema>;
type UpdateFormValues = z.infer<typeof updateSchema>;

export default function EmployeeManagementPage() {
  const [activeTab, setActiveTab] = useState<"directory" | "onboard">("directory");

  // Directory filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDeptId, setSelectedDeptId] = useState<number>(0);
  const [selectedStatus, setSelectedStatus] = useState<string>("ALL");
  const [page, setPage] = useState(0);

  // Edit employee state
  const [editingEmployee, setEditingEmployee] = useState<EmployeeRow | null>(null);
  const [provisionedData, setProvisionedData] = useState<ProvisionedEmployeeResponse | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editFormError, setEditFormError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];

  const { data: departments, isLoading: deptsLoading } = useDepartments();
  const {
    data: employeeData,
    isLoading: employeesLoading,
    isError: employeesError,
    error: employeesErrorObj,
    refetch: refetchEmployees,
  } = useEmployees({
    query: searchQuery,
    departmentId: selectedDeptId,
    status: selectedStatus,
    page,
    size: 15,
  });

  const provision = useProvisionEmployee();
  const updateMutation = useUpdateEmployee();
  const sendResetEmailMutation = useSendEmployeeResetEmail();

  // Provisioning Form
  const provisionForm = useForm<ProvisionFormValues>({
    resolver: zodResolver(provisionSchema),
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

  // Edit Form
  const editForm = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
  });

  function startEdit(emp: EmployeeRow) {
    setEditingEmployee(emp);
    setEditFormError(null);
    editForm.reset({
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      phone: emp.phone || "",
      designation: emp.designation,
      departmentId: emp.departmentId,
    });
  }

  async function onProvisionSubmit(values: ProvisionFormValues) {
    setFormError(null);
    try {
      const response = await provision.mutateAsync({
        ...values,
        phone: values.phone || undefined,
      });

      setProvisionedData(response);
      toast.success(`Employee ${values.empId} provisioned successfully!`);
      provisionForm.reset({
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
      refetchEmployees();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.problem.detail || error.problem.title || "Failed to provision employee");
      } else {
        setFormError("An unexpected error occurred. Please try again.");
      }
    }
  }

  async function onUpdateSubmit(values: UpdateFormValues) {
    if (!editingEmployee) return;
    setEditFormError(null);
    try {
      await updateMutation.mutateAsync({
        id: editingEmployee.id,
        ...values,
        phone: values.phone || undefined,
      });

      toast.success(`Profile for ${values.firstName} ${values.lastName} updated successfully.`);
      setEditingEmployee(null);
      refetchEmployees();
    } catch (error) {
      if (error instanceof ApiError) {
        setEditFormError(error.problem.detail || error.problem.title || "Failed to update employee");
      } else {
        setEditFormError("An unexpected error occurred. Please try again.");
      }
    }
  }

  async function handleSendResetEmail(employeeId: number, email: string) {
    try {
      await sendResetEmailMutation.mutateAsync(employeeId);
      toast.success(`Password reset email sent to ${email}`);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(error.problem.detail || "Failed to dispatch reset email");
      } else {
        toast.error("Could not reach the server to send reset email.");
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
        title="Employee Directory & Management"
        description="Search, view, and update employee records, corporate email accounts, and onboard new personnel into AccessOne."
      />

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-rule mb-6">
        <button
          type="button"
          onClick={() => setActiveTab("directory")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "directory"
              ? "border-credential text-credential bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-ink hover:bg-slate-50"
          }`}
        >
          <Users className="h-4 w-4" />
          Employee Directory
          {employeeData?.totalElements !== undefined && (
            <span className="ml-1.5 px-2 py-0.5 text-xs font-bold rounded-full bg-slate-100 text-slate-700">
              {employeeData.totalElements}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab("onboard")}
          className={`flex items-center gap-2 px-5 py-3 text-sm font-bold border-b-2 transition-all ${
            activeTab === "onboard"
              ? "border-credential text-credential bg-blue-50/50 rounded-t-xl"
              : "border-transparent text-slate-500 hover:text-ink hover:bg-slate-50"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Onboard New Employee
        </button>
      </div>

      {/* ─── TAB 1: EMPLOYEE DIRECTORY ─── */}
      {activeTab === "directory" && (
        <div className="space-y-6">
          {/* Filter Toolbar */}
          <div className="surface-panel p-4 sm:p-5 rounded-2xl border border-rule bg-surface shadow-xs flex flex-col md:flex-row items-center gap-4 justify-between">
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search name, ID, email, title..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setPage(0);
                }}
                className="h-10 pl-10 rounded-xl text-sm border-rule focus:border-credential"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <select
                value={selectedDeptId}
                onChange={(e) => {
                  setSelectedDeptId(Number(e.target.value));
                  setPage(0);
                }}
                className="h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-semibold text-ink focus:outline-none focus:border-credential"
              >
                <option value="0">All Departments</option>
                {activeDepartments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.deptName} ({dept.deptCode})
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setPage(0);
                }}
                className="h-10 px-3 rounded-xl border border-rule bg-surface text-xs font-semibold text-ink focus:outline-none focus:border-credential"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="RESIGNED">Resigned</option>
                <option value="TERMINATED">Terminated</option>
                <option value="RETIRED">Retired</option>
              </select>

              <Button
                variant="outline"
                size="sm"
                className="h-10 rounded-xl text-xs flex items-center gap-1.5"
                onClick={() => refetchEmployees()}
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Refresh
              </Button>
            </div>
          </div>

          {/* Directory Table */}
          <div className="surface-panel rounded-2xl border border-rule bg-surface shadow-xs overflow-hidden">
            {employeesLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-3 text-slate-500">
                <Loader2 className="h-8 w-8 animate-spin text-credential" />
                <p className="text-xs font-medium">Loading employee directory...</p>
              </div>
            ) : employeesError ? (
              <div className="p-12 text-center text-slate-500 space-y-3">
                <AlertCircle className="h-12 w-12 mx-auto text-amber-500" />
                <p className="text-sm font-bold text-ink">
                  {employeesErrorObj instanceof ApiError && employeesErrorObj.status === 401
                    ? "Session Expired"
                    : "Unable to load employee directory"}
                </p>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  {employeesErrorObj instanceof ApiError && employeesErrorObj.status === 401
                    ? "Your session has expired or the server was restarted. Please sign in again to access employee records."
                    : employeesErrorObj instanceof ApiError
                    ? employeesErrorObj.problem.detail || "An error occurred while fetching the employee records."
                    : "Please check your network connection and try again."}
                </p>
                <div className="pt-2 flex justify-center gap-2">
                  {employeesErrorObj instanceof ApiError && employeesErrorObj.status === 401 ? (
                    <Button
                      variant="default"
                      size="sm"
                      onClick={() => (window.location.href = "/login")}
                    >
                      Sign In Again
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => void refetchEmployees()}
                    >
                      <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
                      Try Again
                    </Button>
                  )}
                </div>
              </div>
            ) : !employeeData || employeeData.content.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                <p className="text-sm font-bold text-ink">No employees found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Try adjusting your search filter or onboard a new employee.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-rule text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3.5 px-4">Employee</th>
                      <th className="py-3.5 px-4">ID & NIC</th>
                      <th className="py-3.5 px-4">Department & Role</th>
                      <th className="py-3.5 px-4">Contact Info</th>
                      <th className="py-3.5 px-4">System User</th>
                      <th className="py-3.5 px-4">Status</th>
                      <th className="py-3.5 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-rule/60 text-slate-700">
                    {employeeData.content.map((emp) => (
                      <tr key={emp.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-blue-100 text-credential font-bold flex items-center justify-center text-xs shrink-0">
                              {emp.firstName.charAt(0)}
                              {emp.lastName.charAt(0)}
                            </div>
                            <div>
                              <p className="font-bold text-ink text-sm">{emp.fullName}</p>
                              <p className="text-[11px] text-slate-500">{emp.designation}</p>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <code className="font-bold text-ink identifier bg-slate-100 px-1.5 py-0.5 rounded text-[11px]">
                              {emp.empId}
                            </code>
                            <p className="text-[11px] text-slate-500">{emp.nic}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div>
                            <span className="font-semibold text-ink">{emp.departmentName}</span>
                            <p className="text-[11px] text-slate-500">Joined: {emp.dateJoined}</p>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <div className="space-y-0.5">
                            <p className="font-medium text-ink flex items-center gap-1.5">
                              <Mail className="h-3 w-3 text-slate-400" />
                              {emp.email}
                            </p>
                            {emp.phone && (
                              <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-slate-400" />
                                {emp.phone}
                              </p>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          {emp.username ? (
                            <div className="flex items-center gap-1.5">
                              <code className="bg-blue-50 text-credential font-bold px-2 py-0.5 rounded text-[11px] identifier">
                                {emp.username}
                              </code>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 italic">No account</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              emp.employmentStatus === "ACTIVE"
                                ? "bg-emerald-100 text-emerald-800"
                                : "bg-slate-200 text-slate-700"
                            }`}
                          >
                            {emp.employmentStatus}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-8 text-xs font-semibold rounded-lg px-2.5 flex items-center gap-1 border-rule hover:bg-blue-50 hover:text-credential"
                              onClick={() => startEdit(emp)}
                              title="Edit Employee Information"
                            >
                              <Edit2 className="h-3 w-3" />
                              Edit
                            </Button>

                            {emp.hasUserAccount && emp.email && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs font-semibold rounded-lg px-2 text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                                onClick={() => handleSendResetEmail(emp.id, emp.email)}
                                title="Send Password Reset Email"
                              >
                                <Send className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination footer */}
            {employeeData && employeeData.totalPages > 1 && (
              <div className="p-4 border-t border-rule flex items-center justify-between text-xs text-slate-500">
                <span>
                  Showing {employeeData.content.length} of {employeeData.totalElements} employees
                </span>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                    disabled={employeeData.first}
                    onClick={() => setPage((p) => Math.max(0, p - 1))}
                  >
                    Previous
                  </Button>
                  <span className="text-xs font-bold text-ink">
                    Page {page + 1} of {employeeData.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs rounded-lg"
                    disabled={employeeData.last}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: ONBOARD NEW EMPLOYEE ─── */}
      {activeTab === "onboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="surface-panel p-6 sm:p-8 rounded-2xl border border-rule bg-surface shadow-xs">
              <div className="flex items-center gap-3 pb-5 border-b border-rule mb-6">
                <div className="h-10 w-10 rounded-xl bg-blue-50 text-credential border border-blue-100 flex items-center justify-center shadow-2xs">
                  <UserPlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="topic-title-lg text-ink">New Employee Record</h2>
                  <p className="text-xs text-slate-500">
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

              <form onSubmit={provisionForm.handleSubmit(onProvisionSubmit)} className="space-y-6" noValidate>
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
                      {...provisionForm.register("empId")}
                    />
                    {provisionForm.formState.errors.empId && (
                      <p className="text-xs text-red-600 font-medium">
                        {provisionForm.formState.errors.empId.message}
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
                      {...provisionForm.register("nic")}
                    />
                    {provisionForm.formState.errors.nic && (
                      <p className="text-xs text-red-600 font-medium">
                        {provisionForm.formState.errors.nic.message}
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
                      {...provisionForm.register("firstName")}
                    />
                    {provisionForm.formState.errors.firstName && (
                      <p className="text-xs text-red-600 font-medium">
                        {provisionForm.formState.errors.firstName.message}
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
                      {...provisionForm.register("lastName")}
                    />
                    {provisionForm.formState.errors.lastName && (
                      <p className="text-xs text-red-600 font-medium">
                        {provisionForm.formState.errors.lastName.message}
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
                      {...provisionForm.register("email")}
                    />
                    {provisionForm.formState.errors.email && (
                      <p className="text-xs text-red-600 font-medium">
                        {provisionForm.formState.errors.email.message}
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
                      {...provisionForm.register("phone")}
                    />
                    {provisionForm.formState.errors.phone && (
                      <p className="text-xs text-red-600 font-medium">
                        {provisionForm.formState.errors.phone.message}
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
                      {...provisionForm.register("departmentId", { valueAsNumber: true })}
                    >
                      <option value="0">Select department...</option>
                      {activeDepartments.map((dept) => (
                        <option key={dept.id} value={dept.id}>
                          {dept.deptName} ({dept.deptCode})
                        </option>
                      ))}
                    </select>
                    {provisionForm.formState.errors.departmentId && (
                      <p className="text-xs text-red-600 font-medium">
                        {provisionForm.formState.errors.departmentId.message}
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
                      {...provisionForm.register("designation")}
                    />
                    {provisionForm.formState.errors.designation && (
                      <p className="text-xs text-red-600 font-medium">
                        {provisionForm.formState.errors.designation.message}
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
                    {...provisionForm.register("dateJoined")}
                  />
                  {provisionForm.formState.errors.dateJoined && (
                    <p className="text-xs text-red-600 font-medium">
                      {provisionForm.formState.errors.dateJoined.message}
                    </p>
                  )}
                </div>

                <div className="pt-4 border-t border-rule flex items-center justify-end gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl text-xs h-10 px-5"
                    onClick={() => provisionForm.reset()}
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
                    <strong className="text-ink">Temporary Password:</strong> Secure 12-char random alphanumeric password is generated and emailed to the user.
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* ─── EDIT EMPLOYEE MODAL ─── */}
      <Dialog open={!!editingEmployee} onOpenChange={(open) => !open && setEditingEmployee(null)}>
        <DialogContent className="sm:max-w-lg rounded-2xl p-6">
          <DialogHeader>
            <div className="flex items-center gap-2.5 text-credential mb-1">
              <User className="h-5 w-5" />
              <DialogTitle className="text-lg font-bold text-ink">Edit Employee Profile</DialogTitle>
            </div>
            <DialogDescription className="text-xs text-slate">
              Update personal details, designation, department, and contact information for{" "}
              <strong className="text-ink">{editingEmployee?.empId}</strong>.
            </DialogDescription>
          </DialogHeader>

          {editFormError && (
            <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 animate-fade-in mb-3">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="font-medium">{editFormError}</span>
            </div>
          )}

          <form onSubmit={editForm.handleSubmit(onUpdateSubmit)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editFirstName" className="text-xs font-semibold text-ink">
                  First Name
                </Label>
                <Input
                  id="editFirstName"
                  className="h-9 rounded-xl text-sm"
                  {...editForm.register("firstName")}
                />
                {editForm.formState.errors.firstName && (
                  <p className="text-[11px] text-red-600">{editForm.formState.errors.firstName.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="editLastName" className="text-xs font-semibold text-ink">
                  Last Name
                </Label>
                <Input
                  id="editLastName"
                  className="h-9 rounded-xl text-sm"
                  {...editForm.register("lastName")}
                />
                {editForm.formState.errors.lastName && (
                  <p className="text-[11px] text-red-600">{editForm.formState.errors.lastName.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editEmail" className="text-xs font-semibold text-ink">
                  Corporate Email
                </Label>
                <Input
                  id="editEmail"
                  type="email"
                  className="h-9 rounded-xl text-sm"
                  {...editForm.register("email")}
                />
                {editForm.formState.errors.email && (
                  <p className="text-[11px] text-red-600">{editForm.formState.errors.email.message}</p>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="editPhone" className="text-xs font-semibold text-ink">
                  Phone
                </Label>
                <Input
                  id="editPhone"
                  className="h-9 rounded-xl text-sm"
                  {...editForm.register("phone")}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="editDepartment" className="text-xs font-semibold text-ink">
                  Department
                </Label>
                <select
                  id="editDepartment"
                  className="w-full h-9 px-3 rounded-xl border border-rule bg-surface text-xs text-ink focus:outline-none focus:border-credential"
                  {...editForm.register("departmentId", { valueAsNumber: true })}
                >
                  {activeDepartments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.deptName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <Label htmlFor="editDesignation" className="text-xs font-semibold text-ink">
                  Designation
                </Label>
                <Input
                  id="editDesignation"
                  className="h-9 rounded-xl text-sm"
                  {...editForm.register("designation")}
                />
                {editForm.formState.errors.designation && (
                  <p className="text-[11px] text-red-600">{editForm.formState.errors.designation.message}</p>
                )}
              </div>
            </div>

            {/* Password Reset Action inside Modal */}
            {editingEmployee?.hasUserAccount && (
              <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/60 flex items-center justify-between gap-3 text-xs">
                <div>
                  <p className="font-bold text-ink">Password Recovery</p>
                  <p className="text-[11px] text-slate-500">Send password reset email to {editingEmployee.email}</p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-semibold bg-white border-blue-200 text-credential hover:bg-blue-100 flex items-center gap-1.5 shrink-0"
                  onClick={() => handleSendResetEmail(editingEmployee.id, editingEmployee.email)}
                  disabled={sendResetEmailMutation.isPending}
                >
                  <KeyRound className="h-3.5 w-3.5" />
                  Send Reset Link
                </Button>
              </div>
            )}

            <DialogFooter className="flex gap-2 pt-2 border-t border-rule">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl text-xs h-9"
                onClick={() => setEditingEmployee(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                size="sm"
                className="rounded-xl text-xs font-semibold h-9 bg-credential hover:bg-credential/90 text-white"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ─── PROVISIONED SUCCESS MODAL ─── */}
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
                <span>An introductory email has also been sent with these credentials.</span>
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
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </RequireRole>
  );
}
