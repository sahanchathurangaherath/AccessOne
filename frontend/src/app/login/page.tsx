"use client";

import { Suspense, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { ApiError, http } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ShieldCheck,
  Lock,
  User,
  Eye,
  EyeOff,
  AlertCircle,
  ShieldAlert,
  Loader2,
  KeyRound,
  IdCard,
  Mail,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";

// ─── Schemas ───
const loginSchema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

const forgotSchema = z.object({
  identifier: z.string().min(1, "Enter your username or registered email"),
});

const resetSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/^(?=.*[A-Za-z])(?=.*\d).+$/, "Password must contain at least one letter and one number"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type LoginFormValues = z.infer<typeof loginSchema>;
type ForgotFormValues = z.infer<typeof forgotSchema>;
type ResetFormValues = z.infer<typeof resetSchema>;

function LoginContent() {
  const { login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const resetTokenParam = searchParams.get("resetToken");

  const [mode, setMode] = useState<"login" | "forgot" | "reset">("login");
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  useEffect(() => {
    if (resetTokenParam) {
      setMode("reset");
      setFormError(null);
      setSuccessMessage(null);
    }
  }, [resetTokenParam]);

  // Form hooks
  const loginForm = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
  });

  const forgotForm = useForm<ForgotFormValues>({
    resolver: zodResolver(forgotSchema),
    defaultValues: { identifier: "" },
  });

  const resetForm = useForm<ResetFormValues>({
    resolver: zodResolver(resetSchema),
    defaultValues: { newPassword: "", confirmPassword: "" },
  });

  // Handlers
  async function onLoginSubmit(values: LoginFormValues) {
    setFormError(null);
    try {
      const user = await login(values.username, values.password);
      router.replace(ROLE_HOME[user.role]);
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.problem.detail ?? "Sign in failed");
      } else {
        setFormError("Cannot reach the server. Check your connection.");
      }
    }
  }

  async function onForgotSubmit(values: ForgotFormValues) {
    setFormError(null);
    setSuccessMessage(null);
    try {
      await http.post("/auth/forgot-password", { identifier: values.identifier });
      setSuccessMessage(
        "If an account exists matching that username or email, a recovery link has been sent to your registered inbox."
      );
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.problem.detail ?? "Failed to send reset link");
      } else {
        setFormError("Cannot reach the server. Check your connection.");
      }
    }
  }

  async function onResetSubmit(values: ResetFormValues) {
    if (!resetTokenParam) {
      setFormError("Missing or invalid password reset token.");
      return;
    }
    setFormError(null);
    setSuccessMessage(null);
    try {
      await http.post("/auth/reset-password", {
        token: resetTokenParam,
        newPassword: values.newPassword,
      });
      setSuccessMessage("Your password has been changed successfully. You can now sign in.");
      resetForm.reset();
    } catch (error) {
      if (error instanceof ApiError) {
        setFormError(error.problem.detail ?? "Password reset link is invalid or expired.");
      } else {
        setFormError("Cannot reach the server. Check your connection.");
      }
    }
  }

  return (
    <div className="w-full max-w-[440px] relative z-10">
      {/* Mobile Header */}
      <div className="lg:hidden flex items-center gap-2.5 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-credential text-white shadow-xs">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <span className="identifier text-base font-bold tracking-wider text-ink">
            ACCESSONE
          </span>
          <p className="text-[11px] text-slate">Corporate ID & Access</p>
        </div>
      </div>

      {/* Form Card Container */}
      <div className="rounded-3xl border border-rule bg-surface p-8 sm:p-10 shadow-panel animate-scale-in">
        {/* Error Alert */}
        {formError && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 animate-fade-in"
          >
            <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="font-medium">{formError}</span>
          </div>
        )}

        {/* Success Alert */}
        {successMessage && (
          <div
            role="alert"
            className="mb-5 flex items-start gap-2.5 rounded-xl border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800 animate-fade-in"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="space-y-2">
              <span className="font-medium">{successMessage}</span>
              {mode === "reset" && (
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs font-semibold bg-white border-emerald-300 text-emerald-800 hover:bg-emerald-100"
                    onClick={() => {
                      setMode("login");
                      setSuccessMessage(null);
                      router.replace("/login");
                    }}
                  >
                    Proceed to Sign in
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── Mode 1: LOGIN ─── */}
        {mode === "login" && (
          <div>
            <div className="mb-6 space-y-1.5">
              <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-ink">Sign in</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Enter your corporate credentials to access the system
              </p>
            </div>

            <form onSubmit={loginForm.handleSubmit(onLoginSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-xs font-semibold text-ink">
                  Username
                </Label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="username"
                    autoComplete="username"
                    autoFocus
                    placeholder="Enter your username"
                    className="h-11 rounded-xl pl-10 text-sm border-rule focus:border-credential"
                    {...loginForm.register("username")}
                  />
                </div>
                {loginForm.formState.errors.username && (
                  <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                    {loginForm.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-xs font-semibold text-ink">
                    Password
                  </Label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode("forgot");
                      setFormError(null);
                      setSuccessMessage(null);
                    }}
                    className="text-xs font-medium text-credential hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11 rounded-xl pl-10 pr-10 text-sm border-rule focus:border-credential"
                    {...loginForm.register("password")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {loginForm.formState.errors.password && (
                  <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                    {loginForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold bg-credential hover:bg-credential/90 text-white mt-2 shadow-xs transition-all"
                disabled={loginForm.formState.isSubmitting}
              >
                {loginForm.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* ─── Mode 2: FORGOT PASSWORD ─── */}
        {mode === "forgot" && (
          <div>
            <button
              type="button"
              onClick={() => {
                setMode("login");
                setFormError(null);
                setSuccessMessage(null);
              }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-ink mb-4 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Sign in
            </button>

            <div className="mb-6 space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">Reset password</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Enter your permanent username or registered corporate email to receive a secure recovery link.
              </p>
            </div>

            <form onSubmit={forgotForm.handleSubmit(onForgotSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="identifier" className="text-xs font-semibold text-ink">
                  Username or Registered Email
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="identifier"
                    autoFocus
                    placeholder="e.g. emp0001 or name@company.lk"
                    className="h-11 rounded-xl pl-10 text-sm border-rule focus:border-credential"
                    {...forgotForm.register("identifier")}
                  />
                </div>
                {forgotForm.formState.errors.identifier && (
                  <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                    {forgotForm.formState.errors.identifier.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold bg-credential hover:bg-credential/90 text-white mt-2 shadow-xs transition-all"
                disabled={forgotForm.formState.isSubmitting}
              >
                {forgotForm.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending Recovery Link...
                  </span>
                ) : (
                  "Send Recovery Email"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* ─── Mode 3: SET NEW PASSWORD (RESET TOKEN IN URL) ─── */}
        {mode === "reset" && (
          <div>
            <div className="mb-6 space-y-1.5">
              <h2 className="text-2xl font-extrabold tracking-tight text-ink">Set new password</h2>
              <p className="text-xs text-slate-500 leading-relaxed">
                Choose a strong new password for your AccessOne account.
              </p>
            </div>

            <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="newPassword" className="text-xs font-semibold text-ink">
                  New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="newPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="At least 8 chars with letter & number"
                    className="h-11 rounded-xl pl-10 pr-10 text-sm border-rule focus:border-credential"
                    {...resetForm.register("newPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetForm.formState.errors.newPassword && (
                  <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                    {resetForm.formState.errors.newPassword.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-ink">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your new password"
                    className="h-11 rounded-xl pl-10 pr-10 text-sm border-rule focus:border-credential"
                    {...resetForm.register("confirmPassword")}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                    {resetForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold bg-credential hover:bg-credential/90 text-white mt-2 shadow-xs transition-all"
                disabled={resetForm.formState.isSubmitting}
              >
                {resetForm.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating Password...
                  </span>
                ) : (
                  "Update Password"
                )}
              </Button>
            </form>
          </div>
        )}

        {/* Security Notice */}
        <div className="mt-6 rounded-2xl border border-rule bg-slate-50/80 p-3.5 text-xs text-slate">
          <div className="flex items-start gap-2.5">
            <ShieldAlert className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-ink">Authorized Personnel Only</p>
              <p className="text-[11px] leading-relaxed text-slate-500">
                Access is logged and audited according to corporate security policy.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex min-h-screen w-screen overflow-hidden bg-paper">
      {/* Left Branding Showcase Panel */}
      <div className="hidden lg:flex flex-col justify-between w-[44%] min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#1F4B8E] relative overflow-hidden p-12 text-white">
        {/* Decorative Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:28px_28px] pointer-events-none" />
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-indigo-500/20 blur-[120px] pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 backdrop-blur border border-white/15 shadow-sm">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <div>
            <span className="identifier text-lg font-bold tracking-wider text-white">
              ACCESSONE
            </span>
            <p className="text-xs text-blue-200">ID & Access Management</p>
          </div>
        </div>

        {/* Hero Copy */}
        <div className="relative z-10 space-y-6 my-auto max-w-md">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3.5 py-1 text-xs font-medium text-blue-100 backdrop-blur">
            <KeyRound className="h-3.5 w-3.5 text-blue-300" />
            <span>Unified Corporate Credential Control</span>
          </div>

          <h1 className="text-4xl font-extrabold tracking-tight leading-tight text-white">
            Secure, Instant <br />
            <span className="text-blue-300">Identity & Physical Access</span>
          </h1>

          <p className="text-sm leading-relaxed text-slate-300">
            From smart employee badges and biometric door decisions to visitor pass generation and high-volume card printing queues.
          </p>

          <div className="grid grid-cols-2 gap-3 pt-4">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
              <IdCard className="h-5 w-5 text-blue-300 mb-2" />
              <p className="text-xs font-semibold text-white">Card Lifecycle</p>
              <p className="text-[11px] text-slate-300">Request, verify & print</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3.5 backdrop-blur">
              <ShieldAlert className="h-5 w-5 text-blue-300 mb-2" />
              <p className="text-xs font-semibold text-white">Access Audit</p>
              <p className="text-[11px] text-slate-300">Real-time gate policies</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-400">
          <span>© {new Date().getFullYear()} AccessOne Security.</span>
          <span>Enterprise Edition</span>
        </div>
      </div>

      {/* Right Login Form Panel */}
      <div className="w-full lg:w-[56%] min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 relative overflow-y-auto">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-credential" />
            </div>
          }
        >
          <LoginContent />
        </Suspense>
      </div>
    </div>
  );
}
