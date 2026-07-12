"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/lib/statusPill";
import { SortableHeader, useSortedRows, SortState } from "@/components/SortableHeader";

type D = { id: string; name: string; licenseNo: string; licenseCategory: string; licenseExpiry: string; contact: string; safetyScore: number; status: string };

type SortKey = "name" | "licenseNo" | "licenseCategory" | "licenseExpiry" | "contact" | "safetyScore" | "status";

export default function DriversPage() {
  const [rows, setRows] = useState<D[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "name", dir: "asc" });
  const today = new Date().toISOString().slice(0, 10);
  const nextYr = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const [form, setForm] = useState({ name: "", licenseNo: "", licenseCategory: "LMV", licenseExpiry: nextYr, contact: "", safetyScore: 90, status: "AVAILABLE" });

  async function load() {
    const params = new URLSearchParams({ q });
    const r = await fetch(`/api/drivers?${params}`);
    setRows(await r.json());
  }
  useEffect(() => { load(); }, [q]);

  async function save() {
    setErr(null);
    const r = await fetch("/api/drivers", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || "Failed"); return; }
    setShowAdd(false);
    setForm({ name: "", licenseNo: "", licenseCategory: "LMV", licenseExpiry: nextYr, contact: "", safetyScore: 90, status: "AVAILABLE" });
    load();
  }

  async function setStatusOf(d: D, s: string) {
    await fetch(`/api/drivers/${d.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: s }) });
    load();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Drivers & Safety Profiles</h1>
        <button className="btn" onClick={() => setShowAdd(true)}>+ Add Driver</button>
      </div>
      <div className="flex gap-2">
        <input placeholder="Search name or license…" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>


      <div className="card p-0 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <SortableHeader label="Driver" colKey="name" sort={sort} setSort={setSort} />
              <SortableHeader label="License No." colKey="licenseNo" sort={sort} setSort={setSort} />
              <SortableHeader label="Category" colKey="licenseCategory" sort={sort} setSort={setSort} />
              <SortableHeader label="Expiry" colKey="licenseExpiry" sort={sort} setSort={setSort} />
              <SortableHeader label="Contact" colKey="contact" sort={sort} setSort={setSort} />
              <SortableHeader label="Safety" colKey="safetyScore" sort={sort} setSort={setSort} />
              <SortableHeader label="Status" colKey="status" sort={sort} setSort={setSort} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="text-muted italic p-4">No drivers.</td></tr>}
            {useSortedRows(rows, sort).map((d) => {
              const expired = new Date(d.licenseExpiry) < new Date();
              return (
                <tr key={d.id}>
                  <td className="font-medium">{d.name}</td>
                  <td>{d.licenseNo}</td>
                  <td>{d.licenseCategory}</td>
                  <td className={expired ? "text-bad font-semibold" : ""}>
                    {new Date(d.licenseExpiry).toISOString().slice(0, 10)}
                    {expired && <span className="ml-2 badge badge-bad">EXPIRED</span>}
                  </td>
                  <td>{d.contact}</td>
                  <td>{d.safetyScore}%</td>
                  <td><StatusPill status={d.status} /></td>
                  <td>
                    <select value={d.status} onChange={(e) => setStatusOf(d, e.target.value)}>
                      <option value="AVAILABLE">Available</option>
                      <option value="ON_TRIP">On Trip</option>
                      <option value="OFF_DUTY">Off Duty</option>
                      <option value="SUSPENDED">Suspended</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-semibold">Add Driver</div>
              <button onClick={() => setShowAdd(false)} className="text-muted">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <F label="Name"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
              <F label="License No."><input value={form.licenseNo} onChange={(e) => setForm({ ...form, licenseNo: e.target.value })} /></F>
              <F label="Category">
                <select value={form.licenseCategory} onChange={(e) => setForm({ ...form, licenseCategory: e.target.value })}>
                  <option>LMV</option><option>HMV</option><option>HAZ</option>
                </select>
              </F>
              <F label="License Expiry"><input type="date" value={form.licenseExpiry} onChange={(e) => setForm({ ...form, licenseExpiry: e.target.value })} /></F>
              <F label="Contact"><input value={form.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} /></F>
              <F label="Safety Score"><input type="number" value={form.safetyScore} onChange={(e) => setForm({ ...form, safetyScore: Number(e.target.value) })} /></F>
            </div>
            {err && <div className="text-bad text-sm">{err}</div>}
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="btn" onClick={save}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function F({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="text-sm">
      <div className="text-xs text-muted uppercase mb-1">{label}</div>
      {children}
    </label>
  );
}
