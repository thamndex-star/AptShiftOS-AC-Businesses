import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col items-center justify-center px-6 text-center">
      <p className="rounded-full bg-slate-900 px-3 py-1 text-xs text-white">Business-in-a-Box</p>
      <h1 className="mt-6 text-4xl font-bold text-slate-900">Run your service business from one dashboard</h1>
      <p className="mt-4 max-w-2xl text-slate-600">
        Manage leads, jobs, deposits, invoices, and team members in a simple multi-tenant SaaS built for AC and
        service companies.
      </p>
      <div className="mt-8 flex gap-3">
        <Link href="/signup" className="rounded-md bg-slate-900 px-5 py-2 text-sm font-medium text-white">
          Get started
        </Link>
        <Link href="/login" className="rounded-md border border-slate-300 bg-white px-5 py-2 text-sm font-medium">
          Login
        </Link>
      </div>
    </main>
  );
}
