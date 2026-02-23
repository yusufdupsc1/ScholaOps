import Link from "next/link";

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-2xl font-bold">Forgot password</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Password reset flow is not configured yet. Contact your administrator.
      </p>
      <Link href="/auth/login" className="mt-6 text-sm underline underline-offset-4">
        Back to login
      </Link>
    </main>
  );
}
