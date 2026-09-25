"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/form/field";
import { FileUploadField } from "@/components/form/file-upload-field";
import { applyServerErrors } from "@/lib/forms";
import { useAuth } from "@/lib/auth";
import { ROLE_LABEL } from "@/lib/roles";
import { cn } from "@/lib/utils";
import {
  IdCard,
  RefreshCw,
  Clock,
  ShieldCheck,
  Wifi,
  User,
  CheckCircle2,
  AlertCircle,
  Camera,
  ChevronRight,
  ChevronLeft,
  Check,
  Send,
  Save,
  Info,
  Building2,
  BadgeCheck,
  Sparkles,
} from "lucide-react";
import {
  requests,
  useUploadPhoto,
  useSubmitRequest,
  type CardRequestDetail,
  type RequestType,
} from "../_hooks/useRequests";

const schema = z
  .object({
    requestType: z.enum(["NEW", "REPLACEMENT", "RENEWAL"]),
    reason: z.string().max(255).optional(),
    previousCardId: z.number().int().positive().optional(),
  })
  .refine((v) => v.requestType !== "REPLACEMENT" || !!v.reason?.trim(), {
    path: ["reason"],
    message: "Please state why the replacement card is required",
  })
  .refine((v) => v.requestType !== "REPLACEMENT" || !!v.previousCardId, {
    path: ["previousCardId"],
    message: "Please enter the numeric ID of the previous card",
  });

type FormValues = z.infer<typeof schema>;

const WORKSPACE_STEPS = [
  { id: 0, title: "Identification & Type", desc: "Select badge issuance category" },
  { id: 1, title: "Card Specification", desc: "Access level & justification" },
  { id: 2, title: "Biometric & Review", desc: "Upload photo & verify badge" },
];

type TypeOption = {
  type: RequestType;
  title: string;
  badge: string;
  description: string;
  icon: typeof IdCard;
  colorClass: string;
  bgActiveClass: string;
};

const TYPE_OPTIONS: TypeOption[] = [
  {
    type: "NEW",
    title: "Initial New Badge",
    badge: "New Hire / First Card",
    description: "For new employees or those claiming their initial corporate RFID credential.",
    icon: IdCard,
    colorClass: "text-blue-600",
    bgActiveClass: "border-credential bg-blue-50/50 ring-2 ring-credential/20 shadow-xs",
  },
  {
    type: "REPLACEMENT",
    title: "Card Replacement",
    badge: "Lost / Damaged",
    description: "Replace a lost, broken, stolen, or malfunctioning smart access badge.",
    icon: RefreshCw,
    colorClass: "text-amber-600",
    bgActiveClass: "border-amber-600 bg-amber-50/50 ring-2 ring-amber-500/20 shadow-xs",
  },
  {
    type: "RENEWAL",
    title: "Validity Renewal",
    badge: "Contract Extension",
    description: "Extend validity period for renewed contracts or periodic security reissuance.",
    icon: Clock,
    colorClass: "text-emerald-600",
    bgActiveClass: "border-emerald-600 bg-emerald-50/50 ring-2 ring-emerald-500/20 shadow-xs",
  },
];

export function RequestForm({ existing }: { existing?: CardRequestDetail }) {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [formError, setFormError] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    existing?.hasPhoto ? `/api/v1/requests/${existing.id}/photo` : null
  );

  const create = requests.useCreate();
  const update = requests.useUpdate();
  const uploadPhoto = useUploadPhoto();
  const submitRequest = useSubmitRequest();

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      requestType: (existing?.requestType as RequestType) ?? "NEW",
      reason: existing?.reason ?? "",
      previousCardId: existing?.previousCardId ?? undefined,
    },
  });

  const requestType = form.watch("requestType");
  const reasonText = form.watch("reason") ?? "";
  const previousCardId = form.watch("previousCardId");
  const isReplacement = requestType === "REPLACEMENT";
  const busy =
    create.isPending || update.isPending || uploadPhoto.isPending || submitRequest.isPending;

  // Sync photo file changes to preview URL
  useEffect(() => {
    if (photoFile) {
      const url = URL.createObjectURL(photoFile);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    } else if (existing?.hasPhoto) {
      setPreviewUrl(`/api/v1/requests/${existing.id}/photo`);
    } else {
      setPreviewUrl(null);
    }
  }, [photoFile, existing]);

  // Display metadata
  const displayName = existing?.employeeName ?? user?.username ?? "Corporate Employee";
  const displayRole = user?.role ? ROLE_LABEL[user.role] : "Staff Member";
  const displayEmpId =
    existing?.empId ?? (user?.employeeId ? `EMP-${user.employeeId}` : "EMP-001");
  const displayDept = existing?.departmentName ?? "Headquarters / Operations";

  // Step 1 Validation -> Proceed to Step 2
  const handleNextFromStep1 = async () => {
    const valid = await form.trigger(["requestType"]);
    if (valid) {
      setFormError(null);
      setCurrentStep(1);
    }
  };

  // Step 2 Validation -> Proceed to Step 3
  const handleNextFromStep2 = async () => {
    const fieldsToValidate: (keyof FormValues)[] = ["requestType"];
    if (isReplacement) {
      fieldsToValidate.push("reason", "previousCardId");
    }
    const valid = await form.trigger(fieldsToValidate);
    if (valid) {
      setFormError(null);
      setCurrentStep(2);
    }
  };

  // Save as Draft
  const handleSaveDraft = async () => {
    setFormError(null);
    try {
      const values = form.getValues();
      const body = {
        requestType: values.requestType,
        reason: values.reason?.trim() || undefined,
        previousCardId: isReplacement ? values.previousCardId : undefined,
      };

      const saved = existing
        ? await update.mutateAsync({ id: existing.id, body })
        : await create.mutateAsync(body);

      if (photoFile) {
        await uploadPhoto.mutateAsync({ id: saved.id, file: photoFile });
      }

      router.push(`/employee/requests/${saved.id}`);
    } catch (error) {
      const message = applyServerErrors(error, form.setError);
      if (message) setFormError(message);
    }
  };

  // Save and Submit directly for HR verification
  const handleSubmitFinal = async () => {
    setFormError(null);
    try {
      const valid = await form.trigger();
      if (!valid) return;

      const values = form.getValues();
      const body = {
        requestType: values.requestType,
        reason: values.reason?.trim() || undefined,
        previousCardId: isReplacement ? values.previousCardId : undefined,
      };

      const saved = existing
        ? await update.mutateAsync({ id: existing.id, body })
        : await create.mutateAsync(body);

      if (photoFile) {
        await uploadPhoto.mutateAsync({ id: saved.id, file: photoFile });
      }

      // Automatically transition from DRAFT to SUBMITTED
      await submitRequest.mutateAsync(saved.id);
      router.push("/employee");
    } catch (error) {
      const message = applyServerErrors(error, form.setError);
      if (message) setFormError(message);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* ─── 1. TOP STEPPER INDICATOR (Microfinance Lifecycle Style) ─── */}
      <div className="rounded-2xl border border-rule bg-surface p-4 sm:p-6 shadow-xs">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {WORKSPACE_STEPS.map((step, idx) => {
            const isCompleted = idx < currentStep;
            const isActive = idx === currentStep;
            return (
              <div
                key={step.id}
                className="flex items-center flex-1 last:flex-none cursor-pointer group"
                onClick={() => {
                  if (idx < currentStep) setCurrentStep(idx);
                }}
              >
                <div
                  className={cn(
                    "step-dot transition-all duration-200",
                    isCompleted && "step-dot-completed",
                    isActive && "step-dot-active scale-105",
                    idx > currentStep && "step-dot-inactive"
                  )}
                >
                  {isCompleted ? <Check className="h-4.5 w-4.5" /> : idx + 1}
                </div>
                <div className="ml-3 min-w-0">
                  <p
                    className={cn(
                      "text-sm font-bold leading-none tracking-tight",
                      isActive
                        ? "text-credential font-extrabold"
                        : isCompleted
                        ? "text-emerald-700"
                        : "text-slate-400"
                    )}
                  >
                    {step.title}
                  </p>
                  <p className="mt-1 text-xs text-slate-500 hidden md:block">
                    {step.desc}
                  </p>
                </div>
                {idx < WORKSPACE_STEPS.length - 1 && (
                  <div
                    className={cn(
                      "step-line mx-4 hidden sm:block",
                      isCompleted && "step-line-completed"
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Global Form Error Alert */}
      {formError && (
        <div className="rounded-xl border border-red-200 bg-red-50/90 p-4 text-sm font-medium text-red-700 flex items-start gap-3 animate-fade-in shadow-xs">
          <AlertCircle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <p className="flex-1">{formError}</p>
        </div>
      )}

      {/* ─── 2. STEP CONTENT PANELS ─── */}
      <div className="grid gap-8 lg:grid-cols-12 items-start">
        {/* Main Step Workspace Panel */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* STEP 0: Identification & Request Type */}
          {currentStep === 0 && (
            <div className="rounded-2xl border border-rule bg-surface p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
              {/* Employee Pre-Verified Identity Card */}
              <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-blue-50/70 via-white to-slate-50 p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-blue-100 pb-3 mb-3.5">
                  <div className="flex items-center gap-2">
                    <BadgeCheck className="h-5 w-5 text-credential" />
                    <span className="text-xs font-bold uppercase tracking-wider text-credential">
                      Verified Directory Record
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-bold text-emerald-800">
                    <span className="h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
                    ACTIVE EMPLOYEE
                  </span>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex h-13 w-13 items-center justify-center rounded-2xl bg-credential text-white text-lg font-bold shadow-xs">
                    {displayName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base font-bold text-ink truncate">{displayName}</h3>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-slate-500">
                      <span className="identifier font-bold text-slate-700">{displayEmpId}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-slate-400" />
                        {displayDept}
                      </span>
                      <span>•</span>
                      <span className="text-credential font-semibold">{displayRole}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Request Type Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-rule">
                  <label className="text-sm font-extrabold uppercase tracking-wider text-ink">
                    Select Card Issuance Type <span className="text-red-500">*</span>
                  </label>
                  <span className="badge-topic text-[10px]">Step 1 of 3</span>
                </div>

                <div className="grid gap-3.5 sm:grid-cols-3">
                  {TYPE_OPTIONS.map((opt) => {
                    const Icon = opt.icon;
                    const isSelected = requestType === opt.type;
                    return (
                      <button
                        key={opt.type}
                        type="button"
                        onClick={() => {
                          form.setValue("requestType", opt.type, { shouldValidate: true });
                        }}
                        className={cn(
                          "relative flex flex-col items-start rounded-2xl border p-4.5 text-left transition-all cursor-pointer select-none",
                          isSelected
                            ? opt.bgActiveClass
                            : "border-rule bg-white hover:border-slate-300 hover:bg-slate-50/80"
                        )}
                      >
                        <div className="flex w-full items-center justify-between mb-3">
                          <div
                            className={cn(
                              "flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 transition-colors",
                              isSelected && "bg-white shadow-2xs"
                            )}
                          >
                            <Icon className={cn("h-5 w-5", opt.colorClass)} />
                          </div>
                          {isSelected && (
                            <div className="flex h-5.5 w-5.5 items-center justify-center rounded-full bg-credential text-white shadow-xs">
                              <Check className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-extrabold text-ink">{opt.title}</span>
                        <span className="mt-0.5 text-[11px] font-bold text-slate-500 uppercase tracking-wide">
                          {opt.badge}
                        </span>
                        <span className="mt-2 text-xs text-slate-600 leading-relaxed">
                          {opt.description}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* STEP 1: Card Specification & Justification */}
          {currentStep === 1 && (
            <div className="rounded-2xl border border-rule bg-surface p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-rule pb-4">
                <div>
                  <h3 className="topic-title-lg text-ink">Card Specification & Notes</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Provide reason and any replacement context for HR & IT authorization
                  </p>
                </div>
                <span className="badge-topic">
                  {requestType} CARD
                </span>
              </div>

              {/* Conditional Replacement Warning & Input */}
              {isReplacement && (
                <div className="rounded-2xl border border-amber-200 bg-amber-50/60 p-5 space-y-3 animate-fade-in">
                  <div className="flex items-center gap-2.5 text-amber-800">
                    <RefreshCw className="h-5 w-5" />
                    <h4 className="text-sm font-bold uppercase tracking-wider">
                      Replacement Authorization Required
                    </h4>
                  </div>
                  <p className="text-sm text-amber-700 leading-relaxed">
                    Under corporate policy, issuance of a replacement badge will automatically deactivate
                    and revoke access rights from the previous card upon physical badge handover.
                  </p>

                  <Field
                    label="Previous Card Numeric ID"
                    name="previousCardId"
                    required
                    hint="Enter the numeric ID printed on your previous badge or available in IT logs"
                    error={form.formState.errors.previousCardId?.message}
                  >
                    <div className="relative">
                      <Input
                        id="previousCardId"
                        type="number"
                        placeholder="e.g. 1042"
                        className="bg-white pl-9 h-11 text-base rounded-xl"
                        value={previousCardId ?? ""}
                        onChange={(e) => {
                          const val = e.target.value ? Number(e.target.value) : undefined;
                          form.setValue("previousCardId", val, { shouldValidate: true });
                        }}
                        aria-invalid={!!form.formState.errors.previousCardId}
                      />
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                        #
                      </span>
                    </div>
                  </Field>
                </div>
              )}

              {/* Reason / Justification Field */}
              <Field
                label={
                  isReplacement
                    ? "Detailed Reason for Replacement *"
                    : "Additional Request Notes / Justification (Optional)"
                }
                name="reason"
                required={isReplacement}
                hint={
                  isReplacement
                    ? "Specify the circumstances of loss or card malfunction for the security log."
                    : "Optional instructions for card printing or facility access."
                }
                error={form.formState.errors.reason?.message}
              >
                <div className="relative">
                  <Textarea
                    id="reason"
                    maxLength={255}
                    placeholder={
                      isReplacement
                        ? "e.g. Card was misplaced in transit on Friday; incident reported to line manager."
                        : "e.g. Requires standard headquarters RFID access and secure server room clearance."
                    }
                    className="min-h-28 resize-none bg-white text-base rounded-xl"
                    aria-invalid={!!form.formState.errors.reason}
                    {...form.register("reason")}
                  />
                  <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                    <span>Clear and accurate details expedite HR approval.</span>
                    <span className="font-mono">{reasonText.length} / 255</span>
                  </div>
                </div>
              </Field>
            </div>
          )}

          {/* STEP 2: Biometric Photo & Verification Review */}
          {currentStep === 2 && (
            <div className="rounded-2xl border border-rule bg-surface p-6 sm:p-8 shadow-xs space-y-6 animate-fade-in">
              <div className="flex items-center justify-between border-b border-rule pb-4">
                <div>
                  <h3 className="topic-title-lg text-ink">Biometric Identification & Final Review</h3>
                  <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                    Upload your official portrait and review card layout before final submission
                  </p>
                </div>
                <span className="badge-topic">
                  Step 3 of 3
                </span>
              </div>

              {/* Photo Upload Dropzone */}
              <div className="space-y-3">
                <FileUploadField
                  label="Official ID Portrait Photo"
                  name="photo"
                  accept="image/jpeg,image/png"
                  maxBytes={2 * 1024 * 1024}
                  hint="JPEG or PNG format, maximum 2 MB. Required for physical smart badge printing."
                  onChange={setPhotoFile}
                  existingLabel={existing?.hasPhoto ? "Current badge photo on file" : undefined}
                  existingPreviewUrl={previewUrl ?? undefined}
                />
              </div>

              {/* Pre-Submission Verification Checklist */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5 space-y-3">
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2.5">
                  <CheckCircle2 className="h-5 w-5 text-credential" />
                  Pre-Submission Review Checklist
                </h4>
                <div className="grid gap-2.5 sm:grid-cols-2 text-sm text-slate-700">
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span>
                      Type: <strong className="font-bold text-ink">{requestType}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span>
                      Employee: <strong className="font-bold text-ink">{displayName}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span>
                      ID Number: <strong className="font-bold text-ink">{displayEmpId}</strong>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <span className="h-2 w-2 rounded-full bg-emerald-600" />
                    <span>
                      Photo: <strong className="font-bold text-ink">{photoFile || previewUrl ? "Attached" : "Pending"}</strong>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ─── 3. STICKY BOTTOM ACTION TOOLBAR ─── */}
          <div className="rounded-2xl border border-rule bg-white/95 backdrop-blur-md p-4 sm:p-5 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3.5 sticky bottom-4 z-10">
            <div className="flex items-center gap-2.5 w-full sm:w-auto">
              {currentStep > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-rule bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                  <span>Previous</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => router.push("/employee")}
                  disabled={busy}
                  className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-rule bg-white text-sm font-semibold text-slate-600 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-4.5 w-4.5" />
                  <span>Cancel</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4.5 py-2.5 rounded-xl border border-rule bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4.5 w-4.5 text-slate-500" />
                <span>{existing?.status === "REJECTED" ? "Save Changes" : "Save Draft"}</span>
              </button>
            </div>

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              {currentStep === 0 && (
                <button
                  type="button"
                  onClick={handleNextFromStep1}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-credential text-sm font-semibold text-white hover:bg-credential/90 shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <span>Continue to Specifications</span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              )}

              {currentStep === 1 && (
                <button
                  type="button"
                  onClick={handleNextFromStep2}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-credential text-sm font-semibold text-white hover:bg-credential/90 shadow-xs transition-colors cursor-pointer w-full sm:w-auto"
                >
                  <span>Continue to Biometrics</span>
                  <ChevronRight className="h-4.5 w-4.5" />
                </button>
              )}

              {currentStep === 2 && (
                <button
                  type="button"
                  onClick={handleSubmitFinal}
                  disabled={busy}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3 rounded-xl bg-credential text-sm font-semibold text-white hover:bg-credential/90 shadow-sm transition-all cursor-pointer w-full sm:w-auto"
                >
                  <Send className="h-4.5 w-4.5" />
                  <span>
                    {existing?.status === "REJECTED"
                      ? "Resubmit for HR Verification"
                      : "Submit for HR Verification"}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Side Preview & Guidelines Column (Right) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-6">
          {/* Live ID Badge Mockup Card */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Camera className="h-5 w-5 text-credential" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                  Live Badge Preview
                </h3>
              </div>
              <span className="rounded-md bg-blue-50 px-2.5 py-1 text-xs font-bold text-credential border border-blue-200">
                CR80 Smart Card
              </span>
            </div>

            {/* Card Mockup Visualizer */}
            <div className="relative mx-auto w-full max-w-[340px] overflow-hidden rounded-2xl border border-slate-300 bg-white shadow-md select-none transition-all hover:shadow-lg">
              {/* Top Header Ribbon */}
              <div className="flex items-center justify-between bg-gradient-to-r from-slate-900 via-[#1F4B8E] to-blue-800 px-4 py-2.5 text-white">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-blue-200" />
                  <span className="identifier text-xs font-bold tracking-[0.2em] text-white">
                    ACCESSONE ID
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 rotate-90 text-blue-200" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-100">
                    SMART PASS
                  </span>
                </div>
              </div>

              {/* Card Content */}
              <div className="flex gap-4 p-4">
                {/* Photo Area */}
                <div className="relative flex-shrink-0 h-26 w-21">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="Badge portrait preview"
                      className="h-26 w-21 rounded-lg border border-slate-200 object-cover shadow-xs"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src =
                          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='84' height='104' viewBox='0 0 84 104'%3E%3Crect width='84' height='104' fill='%23f8fafc'/%3E%3Ccircle cx='42' cy='38' r='15' fill='%23cbd5e1'/%3E%3Cpath d='M21 86 C21 62, 63 62, 63 86' fill='%23cbd5e1'/%3E%3Ctext x='50%25' y='96' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif' font-size='9' font-weight='700' fill='%2394a3b8'%3ENO PHOTO%3C/text%3E%3C/svg%3E";
                      }}
                    />
                  ) : (
                    <div className="flex h-26 w-21 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 text-slate-400">
                      <User className="h-8 w-8 stroke-1" />
                      <span className="mt-1 text-[10px] font-bold">NO PHOTO</span>
                    </div>
                  )}
                  {/* EMV Chip Simulation */}
                  <div className="absolute bottom-1.5 right-1.5 h-4.5 w-5 rounded border border-amber-300 bg-gradient-to-br from-amber-100 to-amber-200 shadow-xs flex items-center justify-center">
                    <div className="h-2 w-3 border border-amber-400/60 rounded-xs" />
                  </div>
                </div>

                {/* Details Area */}
                <div className="min-w-0 flex-1 space-y-1.5">
                  <p className="truncate text-sm font-bold text-ink leading-tight">
                    {displayName}
                  </p>
                  <p className="truncate text-xs font-semibold text-credential">
                    {displayRole}
                  </p>
                  <div className="pt-2">
                    <span className="identifier rounded-md bg-slate-100 px-2 py-0.5 text-xs font-bold text-slate-700 border border-slate-200">
                      {displayEmpId}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="inline-block rounded-md bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700 border border-blue-200">
                      {requestType} CARD
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-center text-xs text-slate-400">
              Visual preview of physical RFID smart badge
            </p>
          </div>

          {/* Photo Standards & Compliance Checklist */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <Info className="h-5 w-5 text-credential" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Photo Requirements
              </h3>
            </div>

            <ul className="space-y-2.5 text-sm text-slate-600">
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>Recent color passport portrait against plain background</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>Full frontal facial view with neutral expression</span>
              </li>
              <li className="flex items-start gap-2.5">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
                <span>Max size 2MB (JPG or PNG format)</span>
              </li>
            </ul>
          </div>

          {/* Process Timeline Card */}
          <div className="rounded-2xl border border-rule bg-surface p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2.5">
              <Sparkles className="h-5 w-5 text-slate-600" />
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">
                Lifecycle Stages
              </h3>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-credential text-white text-xs font-bold">
                  1
                </div>
                <div>
                  <p className="font-bold text-ink">Draft & Biometrics</p>
                  <p className="text-xs text-slate-500">Attach photo & submit</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-700">HR Verification</p>
                  <p className="text-xs text-slate-500">Identity & eligibility review</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-600 text-xs font-bold border border-slate-200">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-700">Printing & Activation</p>
                  <p className="text-xs text-slate-500">Dispatched & RFID enabled</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


