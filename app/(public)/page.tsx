import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0B0F19] text-slate-100">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-220px] h-[520px] w-[760px] -translate-x-1/2 rounded-full bg-indigo-500/20 blur-[120px]" />
        <div className="absolute right-[-180px] top-[180px] h-[420px] w-[420px] rounded-full bg-cyan-400/10 blur-[110px]" />
        <div className="absolute bottom-[-140px] left-[-80px] h-[360px] w-[360px] rounded-full bg-violet-500/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.07),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03),transparent_20%,transparent_80%,rgba(255,255,255,0.02))]" />
      </div>

      <div className="relative mx-auto w-full max-w-6xl px-6 py-16 md:py-24">
        <section className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <p className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.14em] text-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.4)] backdrop-blur">
            Business-in-a-Box
          </p>
          <h1 className="mt-8 bg-gradient-to-b from-white via-slate-100 to-slate-300 bg-clip-text text-4xl font-extrabold leading-tight text-transparent sm:text-5xl md:text-6xl">
            Run Your Entire Service Business Without the Chaos
          </h1>
          <p className="mt-6 max-w-3xl text-base leading-relaxed text-slate-300 sm:text-lg">
            Manage leads, jobs, invoices, payments, and your team - all in one simple system built for AC & service
            companies.
          </p>
          <p className="mt-2 text-base text-slate-400 sm:text-lg">Stop juggling WhatsApp, spreadsheets, and paperwork.</p>
          <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/signup"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(99,102,241,0.45)] transition hover:-translate-y-0.5 hover:from-indigo-400 hover:to-violet-400"
            >
              Start Free Trial
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-slate-100 shadow-[0_12px_35px_rgba(0,0,0,0.35)] backdrop-blur transition hover:-translate-y-0.5 hover:bg-white/15"
            >
              See Demo
            </Link>
          </div>
        </section>

        <section className="mx-auto mt-14 max-w-5xl">
          <div className="overflow-hidden rounded-[24px] border border-white/15 bg-gradient-to-b from-slate-900/85 to-slate-950/90 p-4 shadow-[0_35px_90px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-6">
            <div className="rounded-2xl border border-white/10 bg-[#121826]/90 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] sm:p-5">
              <div className="mb-4 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/80" />
              </div>
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
                  <p className="text-xs text-slate-400">Leads</p>
                  <p className="mt-2 text-2xl font-semibold text-white">128</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
                  <p className="text-xs text-slate-400">Jobs Today</p>
                  <p className="mt-2 text-2xl font-semibold text-white">24</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
                  <p className="text-xs text-slate-400">Pending Invoices</p>
                  <p className="mt-2 text-2xl font-semibold text-white">17</p>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.06] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
                  <p className="text-xs text-slate-400">Revenue (MTD)</p>
                  <p className="mt-2 text-2xl font-semibold text-white">ZAR 88k</p>
                </div>
              </div>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.28)]">
                  <p className="text-xs font-medium text-slate-300">Upcoming Jobs</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-400">
                    <p className="rounded-md bg-white/5 px-3 py-2">10:00 - AC Install - Green Point</p>
                    <p className="rounded-md bg-white/5 px-3 py-2">13:30 - Maintenance - Sea Point</p>
                  </div>
                </div>
                <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4 shadow-[0_10px_25px_rgba(0,0,0,0.28)]">
                  <p className="text-xs font-medium text-slate-300">Payments Status</p>
                  <div className="mt-3 space-y-2 text-sm text-slate-400">
                    <p className="rounded-md bg-white/5 px-3 py-2">Deposits Paid: 9</p>
                    <p className="rounded-md bg-white/5 px-3 py-2">Outstanding: 5</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-20">
          <h2 className="text-center text-3xl font-bold text-white sm:text-4xl">
            Everything You Need to Run Your Service Business
          </h2>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.4)] backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[0.07]">
              <h3 className="text-xl font-semibold text-white">Never Lose a Lead Again</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Capture and track every incoming lead so no opportunity slips through the cracks.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.4)] backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[0.07]">
              <h3 className="text-xl font-semibold text-white">Stay in Control of Jobs</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Plan, assign, and monitor jobs in one place with clear status updates for the whole team.
              </p>
            </article>
            <article className="rounded-2xl border border-white/10 bg-white/[0.05] p-6 shadow-[0_14px_40px_rgba(0,0,0,0.4)] backdrop-blur-sm transition hover:-translate-y-1 hover:bg-white/[0.07]">
              <h3 className="text-xl font-semibold text-white">Get Paid Faster</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">
                Send invoices quickly, track payments, and reduce delays with better payment visibility.
              </p>
            </article>
          </div>
        </section>

        <section className="mt-20 rounded-2xl border border-white/10 bg-white/[0.05] p-8 shadow-[0_16px_45px_rgba(0,0,0,0.4)] backdrop-blur-sm">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Built Specifically for Service Businesses</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            <span className="rounded-full border border-indigo-300/25 bg-indigo-400/10 px-4 py-2 text-sm font-medium text-slate-100 shadow-[0_8px_24px_rgba(99,102,241,0.2)]">
              AC installers
            </span>
            <span className="rounded-full border border-cyan-300/25 bg-cyan-400/10 px-4 py-2 text-sm font-medium text-slate-100 shadow-[0_8px_24px_rgba(34,211,238,0.2)]">
              Technicians
            </span>
            <span className="rounded-full border border-violet-300/25 bg-violet-400/10 px-4 py-2 text-sm font-medium text-slate-100 shadow-[0_8px_24px_rgba(167,139,250,0.2)]">
              Maintenance teams
            </span>
          </div>
        </section>
      </div>
    </main>
  );
}
