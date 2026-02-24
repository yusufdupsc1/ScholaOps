// src/app/auth/reset-password/page.tsx
"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Loader2,
  GraduationCap,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  resetPassword,
  type ResetPasswordFormData,
} from "@/server/actions/auth";

const PASSWORD_RULES = [
  { label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "One number", test: (p: string) => /[0-9]/.test(p) },
];

function ResetForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const email = params.get("email") ?? "";

  const [pending, startTransition] = useTransition();
  const [showPass, setShowPass] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<Omit<ResetPasswordFormData, "token">>({
    password: "",
    confirmPassword: "",
  });

  const set = (k: "password" | "confirmPassword", v: string) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Guard: invalid link
  if (!token || !email) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-destructive/10 mb-2">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="font-semibold text-lg">Invalid reset link</h2>
        <p className="text-sm text-muted-foreground">
          This password reset link is missing required parameters. Please
          request a new one.
        </p>
        <Link href="/auth/forgot-password">
          <Button variant="outline" className="mt-2">
            Request new link
          </Button>
        </Link>
      </div>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await resetPassword(email, { token, ...form });
      if ("error" in res) {
        setError(res.error);
      } else {
        setDone(true);
        setTimeout(() => router.push("/auth/login"), 3000);
      }
    });
  };

  if (done) {
    return (
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-green-500/10 mb-2">
          <CheckCircle2 className="h-7 w-7 text-green-500" />
        </div>
        <h2 className="font-semibold text-lg">Password updated!</h2>
        <p className="text-sm text-muted-foreground">
          Your password has been reset successfully. Redirecting you to login…
        </p>
      </div>
    );
  }

  return (
    <>
      {error && (
        <div className="mb-4 rounded-lg bg-destructive/10 border border-destructive/20 px-4 py-3 text-sm text-destructive">
          {error}
          {error.includes("expired") && (
            <>
              {" "}
              <Link
                href="/auth/forgot-password"
                className="underline underline-offset-4"
              >
                Request a new one.
              </Link>
            </>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="rp-pass">New Password *</Label>
          <div className="relative">
            <Input
              id="rp-pass"
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className="pr-10"
              required
              autoFocus
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              tabIndex={-1}
            >
              {showPass ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {form.password && (
            <div className="mt-2 space-y-1">
              {PASSWORD_RULES.map(({ label, test }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <CheckCircle2
                    className={`h-3.5 w-3.5 ${
                      test(form.password)
                        ? "text-green-500"
                        : "text-muted-foreground/40"
                    }`}
                  />
                  <span
                    className={`text-xs ${
                      test(form.password)
                        ? "text-green-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="rp-confirm">Confirm Password *</Label>
          <Input
            id="rp-confirm"
            type="password"
            placeholder="••••••••"
            value={form.confirmPassword}
            onChange={(e) => set("confirmPassword", e.target.value)}
            className={
              form.confirmPassword && form.confirmPassword !== form.password
                ? "border-destructive"
                : ""
            }
            required
          />
          {form.confirmPassword && form.confirmPassword !== form.password && (
            <p className="text-xs text-destructive">Passwords do not match</p>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Resetting…
            </>
          ) : (
            "Set new password"
          )}
        </Button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <GraduationCap className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Set new password
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">
            Choose a strong password for your account.
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-8 shadow-lg">
          <Suspense
            fallback={
              <div className="h-48 animate-pulse rounded-lg bg-muted" />
            }
          >
            <ResetForm />
          </Suspense>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Remembered your password?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
