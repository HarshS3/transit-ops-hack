"use client";

import { useEffect, useState } from "react";
import { RBAC } from "@/lib/rbac";

const SECTIONS = ["fleet", "drivers", "trips", "fuel", "analytics"] as const;
const SECTION_LABEL: Record<string, string> = {
  fleet: "Fleet", drivers: "Drivers", trips: "Trips", fuel: "Fuel/Exp", analytics: "Analytics",
};
const ROLES = [
  { key: "FLEET_MANAGER", label: "Fleet Manager" },
  { key: "DISPATCHER", label: "Dispatcher" },
  { key: "SAFETY_OFFICER", label: "Safety Officer" },
  { key: "FINANCIAL_ANALYST", label: "Financial Analyst" },
];

export default function SettingsPage() {
  const [me, setMe] = useState<{ name: string; email: string; role: string } | null>(null);
  const [depot, setDepot] = useState("Gandhinagar Depot 424");
  const [currency, setCurrency] = useState("INR (₹)");
  const [unit, setUnit] = useState("Kilometers");
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((j) => setMe(j.user)); }, []);

  const roleLabel: Record<string, string> = {
    FLEET_MANAGER: "Fleet Manager",
    DISPATCHER: "Dispatcher",
    SAFETY_OFFICER: "Safety Officer",
    FINANCIAL_ANALYST: "Financial Analyst",
  };

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card space-y-3">
        <div className="text-sm font-semibold uppercase text-muted tracking-wider">General</div>
        {me && (
          <div className="text-sm space-y-1 border-b border-[#1e2a3a] pb-3">
            <div className="text-muted">Signed in as</div>
            <div>{me.name} <span className="text-muted">({me.email})</span></div>
            <div>Role: <span className="badge badge-warn">{roleLabel[me.role]}</span></div>
          </div>
        )}
        <F label="Depot Name"><input value={depot} onChange={(e) => setDepot(e.target.value)} /></F>
        <F label="Currency">
          <select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option>INR (₹)</option><option>USD ($)</option><option>EUR (€)</option>
          </select>
        </F>
        <F label="Distance Unit">
          <select value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option>Kilometers</option><option>Miles</option>
          </select>
        </F>
        <button className="btn-ghost" onClick={() => { setSaved(true); setTimeout(() => setSaved(false), 2000); }}>
          Save changes
        </button>
        {saved && <div className="text-ok text-sm">Saved</div>}
      </div>

      <div className="card">
        <div className="text-sm font-semibold uppercase text-muted tracking-wider mb-3">Role-Based Access (RBAC)</div>
        <table className="tbl">
          <thead>
            <tr>
              <th>Role</th>
              {SECTIONS.map((s) => <th key={s}>{SECTION_LABEL[s]}</th>)}
            </tr>
          </thead>
          <tbody>
            {ROLES.map((r) => {
              const allowed = RBAC[r.key] || [];
              return (
                <tr key={r.key}>
                  <td className="font-medium">{r.label}</td>
                  {SECTIONS.map((s) => (
                    <td key={s} className={allowed.includes(s) ? "text-ok font-semibold" : "text-muted"}>
                      {allowed.includes(s) ? "✓" : "—"}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className="text-xs text-muted mt-3">
          RBAC is enforced server-side in <code>/lib/auth.ts</code> — role→section map, checked in every API route via <code>requireSection()</code>.
        </div>
      </div>
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm block">
      <div className="text-xs text-muted uppercase mb-1">{label}</div>
      {children}
    </label>
  );
}
