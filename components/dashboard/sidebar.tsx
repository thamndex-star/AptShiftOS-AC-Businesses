import Link from "next/link";
import { SignOutButton } from "@/components/auth/sign-out-button";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/leads", label: "Leads" },
  { href: "/jobs", label: "Jobs" },
  { href: "/invoices", label: "Invoices" },
];

type SidebarProps = {
  businessName: string;
};

export function Sidebar({ businessName }: SidebarProps) {
  return (
    <aside className="flex w-56 flex-col border-r border-slate-200 bg-white p-4">
      <h2 className="mb-6 text-lg font-semibold leading-snug text-slate-900 line-clamp-2">{businessName}</h2>
      <nav className="space-y-2">
        {nav.map((item) => (
          <Link key={item.href} href={item.href} className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-100">
            {item.label}
          </Link>
        ))}
      </nav>
      <div className="mt-auto pt-4 border-t border-slate-100">
        <SignOutButton />
      </div>
    </aside>
  );
}
