"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { ApiError } from "@/lib/api";
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
} from "lucide-react";

const schema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { username: "", password: "" },
  });

  async function onSubmit(values: FormValues) {
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
        <div className="w-full max-w-[420px] relative z-10">
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
            <div className="mb-6 space-y-1.5">
              <h2 className="text-2xl font-bold tracking-tight text-ink">Sign in</h2>
              <p className="text-xs text-slate">
                Enter your corporate credentials to access the system
              </p>
            </div>

            {formError && (
              <div
                role="alert"
                className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-800 animate-fade-in"
              >
                <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                <span className="font-medium">{formError}</span>
              </div>
            )}

            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
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
                    {...form.register("username")}
                  />
                </div>
                {form.formState.errors.username && (
                  <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                    {form.formState.errors.username.message}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-ink">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    className="h-11 rounded-xl pl-10 pr-10 text-sm border-rule focus:border-credential"
                    {...form.register("password")}
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
                {form.formState.errors.password && (
                  <p className="text-xs text-red-600 font-medium mt-1" role="alert">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full h-11 rounded-xl font-semibold bg-credential hover:bg-credential/90 text-white mt-2 shadow-xs transition-all"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>

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
      </div>
    </div>
  );
}
