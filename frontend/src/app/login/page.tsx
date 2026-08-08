"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { ROLE_HOME } from "@/lib/roles";
import { ApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const schema = z.object({
  username: z.string().min(1, "Enter your username"),
  password: z.string().min(1, "Enter your password"),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

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
    <main className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <p className="identifier text-xs uppercase tracking-widest text-slate">
            AccessOne
          </p>
          <h1 className="mt-1 text-2xl font-semibold">Sign in</h1>
          <p className="mt-1 text-sm text-slate">
            Use your corporate account.
          </p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div>
            <Label htmlFor="username">Username</Label>
            <Input id="username" autoComplete="username" autoFocus
                   {...form.register("username")} />
            {form.formState.errors.username && (
              <p className="mt-1 text-sm text-denied" role="alert">
                {form.formState.errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" autoComplete="current-password"
                   {...form.register("password")} />
            {form.formState.errors.password && (
              <p className="mt-1 text-sm text-denied" role="alert">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>

          {formError && (
            <div role="alert"
                 className="rounded-card border border-denied/30 bg-denied/5 px-3 py-2 text-sm text-denied">
              {formError}
            </div>
          )}

          <Button type="submit" className="w-full"
                  disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </div>
    </main>
  );
}
