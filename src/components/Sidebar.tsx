"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const NAV = [
  { href: "/dashboard", label: "Dashboard", section: "dashboard" },
  { href: "/fleet", label: "Fleet", section: "fleet" },
  { href: "/drivers", label: "Drivers", section: "drivers" },
  { href: "/trips", label: "Trips", section: "trips" },
  { href: "/maintenance", label: "Maintenance", section: "maintenance" },
  { href: "/fuel", label: "Fuel & Expenses", section: "fuel" },
  { href: "/analytics", label: "Analytics", section: "analytics" },
  { href: "/settings", label: "Settings", section: "settings" },
];

export default function Sidebar({ allowed }: { allowed: string[] }) {
  const path = usePathname();
  return (
    <aside className="w-56 shrink-0 border-r border-[#1e2a3a] bg-[#0e141d] flex flex-col">
      <div className="p-4 border-b border-[#1e2a3a] flex items-center gap-2">
        <div className="w-7 h-7 rounded bg-brand" />
        <div className="font-semibold">TransitOps</div>
      </div>
      <nav className="flex-1 p-2 space-y-0.5 text-sm">
        {NAV.filter((n) => allowed.includes(n.section)).map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={clsx("nav-item", path?.startsWith(n.href) && "active")}
          >
            {n.label}
          </Link>
        ))}
      </nav>
      <form action="/api/auth/logout" method="post" className="p-3 border-t border-[#1e2a3a]">
        <button
          formAction="/api/auth/logout"
          onClick={async (e) => {
            e.preventDefault();
            await fetch("/api/auth/logout", { method: "POST" });
            window.location.href = "/login";
          }}
          className="btn-ghost w-full text-sm"
        >
          Sign out
        </button>
      </form>
    </aside>
  );
}
