import Link from "next/link";
import { AuthForm } from "@/components/auth/auth-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const callbackError = params.error ? decodeURIComponent(params.error) : null;

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6">
      <section className="w-full rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-1 text-sm text-slate-500">Sign in to access your workspace.</p>
        {callbackError && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-900">
            {callbackError}
          </div>
        )}
        <div className="mt-6">
          <AuthForm mode="login" />
        </div>
        <p className="mt-4 text-sm">
          No account?{" "}
          <Link href="/signup" className="font-medium text-slate-900 underline">
            Sign up
          </Link>
        </p>
      </section>
    </main>
  );
}
