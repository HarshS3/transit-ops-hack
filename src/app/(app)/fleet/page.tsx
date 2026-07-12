"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/lib/statusPill";
import { SortableHeader, useSortedRows, SortState } from "@/components/SortableHeader";
import DocumentsModal from "@/components/DocumentsModal";

type V = { id: string; regNo: string; name: string; type: string; capacityKg: number; odometer: number; acquisitionCost: number; region?: string | null; status: string };

type SortKey = "regNo" | "name" | "type" | "capacityKg" | "odometer" | "acquisitionCost" | "status";

export default function FleetPage() {
  const [rows, setRows] = useState<V[]>([]);
  const [q, setQ] = useState("");
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [sort, setSort] = useState<SortState<SortKey>>({ key: "regNo", dir: "asc" });
  const [docsFor, setDocsFor] = useState<V | null>(null);
  const [form, setForm] = useState({ regNo: "", name: "", type: "Van", capacityKg: 500, odometer: 0, acquisitionCost: 0, region: "HQ", status: "AVAILABLE" });

  async function load() {
    const params = new URLSearchParams({ q, type, status });
    const r = await fetch(`/api/vehicles?${params}`);
    setRows(await r.json());
  }
  useEffect(() => { load(); }, [q, type, status]);

  const sorted = useSortedRows(rows, sort);

  async function save() {
    setErr(null);
    const method = editingId ? "PATCH" : "POST";
    const url = editingId ? `/api/vehicles/${editingId}` : "/api/vehicles";
    const r = await fetch(url, { method, headers: { "content-type": "application/json" }, body: JSON.stringify(form) });
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || "Failed"); return; }
    setShowAdd(false);
    setEditingId(null);
    setForm({ regNo: "", name: "", type: "Van", capacityKg: 500, odometer: 0, acquisitionCost: 0, region: "HQ", status: "AVAILABLE" });
    load();
  }

  async function setStatusOf(v: V, s: string) {
    await fetch(`/api/vehicles/${v.id}`, { method: "PATCH", headers: { "content-type": "application/json" }, body: JSON.stringify({ status: s }) });
    load();
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Vehicle Registry</h1>
        <button className="btn" onClick={() => {
          setForm({ regNo: "", name: "", type: "Van", capacityKg: 500, odometer: 0, acquisitionCost: 0, region: "HQ", status: "AVAILABLE" });
          setEditingId(null);
          setShowAdd(true);
        }}>+ Add Vehicle</button>
      </div>
      <div className="flex gap-2">
        <input placeholder="Search reg no…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select value={type} onChange={(e) => setType(e.target.value)}>
          <option value="ALL">Type: All</option><option>Van</option><option>Truck</option><option>Mini</option>
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">Status: All</option>
          <option value="AVAILABLE">Available</option><option value="ON_TRIP">On Trip</option>
          <option value="IN_SHOP">In Shop</option><option value="RETIRED">Retired</option>
        </select>
      </div>

      

      <div className="card p-0 overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr>
              <SortableHeader label="Reg No." colKey="regNo" sort={sort} setSort={setSort} />
              <SortableHeader label="Name/Model" colKey="name" sort={sort} setSort={setSort} />
              <SortableHeader label="Type" colKey="type" sort={sort} setSort={setSort} />
              <SortableHeader label="Capacity" colKey="capacityKg" sort={sort} setSort={setSort} />
              <SortableHeader label="Odometer" colKey="odometer" sort={sort} setSort={setSort} />
              <SortableHeader label="Acq. Cost" colKey="acquisitionCost" sort={sort} setSort={setSort} />
              <SortableHeader label="Status" colKey="status" sort={sort} setSort={setSort} />
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={8} className="text-muted italic p-4">No vehicles registered.</td></tr>}
            {sorted.map((v) => (
              <tr key={v.id}>
                <td className="font-medium">{v.regNo}</td>
                <td>{v.name}</td>
                <td>{v.type}</td>
                <td>{v.capacityKg} kg</td>
                <td>{v.odometer.toLocaleString()}</td>
                <td>₹{v.acquisitionCost.toLocaleString()}</td>
                <td><StatusPill status={v.status} /></td>
                <td>
                  <div className="flex items-center gap-1">
                    <select value={v.status} onChange={(e) => setStatusOf(v, e.target.value)}>
                      <option value="AVAILABLE">Available</option>
                      <option value="ON_TRIP">On Trip</option>
                      <option value="IN_SHOP">In Shop</option>
                      <option value="RETIRED">Retired</option>
                    </select>
                    <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => {
                      setForm({
                        regNo: v.regNo, name: v.name, type: v.type, capacityKg: v.capacityKg,
                        odometer: v.odometer, acquisitionCost: v.acquisitionCost, region: v.region || "HQ", status: v.status
                      });
                      setEditingId(v.id);
                      setShowAdd(true);
                    }} title="Edit">
                      ✏️ Edit
                    </button>
                    <button className="btn-ghost !px-2 !py-1 text-xs" onClick={() => setDocsFor(v)} title="Documents">
                      📄 Docs
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {docsFor && (
        <DocumentsModal
          vehicleId={docsFor.id}
          vehicleRegNo={docsFor.regNo}
          onClose={() => setDocsFor(null)}
        />
      )}

      {showAdd && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md space-y-3">
            <div className="flex justify-between items-center">
              <div className="font-semibold">{editingId ? "Edit Vehicle" : "Register Vehicle"}</div>
              <button onClick={() => { setShowAdd(false); setEditingId(null); }} className="text-muted">✕</button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <F label="Reg No."><input value={form.regNo} onChange={(e) => setForm({ ...form, regNo: e.target.value })} /></F>
              <F label="Name/Model"><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></F>
              <F label="Type">
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                  <option>Van</option><option>Truck</option><option>Mini</option><option>Car</option>
                </select>
              </F>
              <F label="Capacity (kg)"><input type="number" value={form.capacityKg} onChange={(e) => setForm({ ...form, capacityKg: Number(e.target.value) })} /></F>
              <F label="Odometer"><input type="number" value={form.odometer} onChange={(e) => setForm({ ...form, odometer: Number(e.target.value) })} /></F>
              <F label="Acq. Cost"><input type="number" value={form.acquisitionCost} onChange={(e) => setForm({ ...form, acquisitionCost: Number(e.target.value) })} /></F>
              <F label="Region">
                <select value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })}>
                  <option>HQ</option><option>North</option><option>South</option>
                </select>
              </F>
            </div>
            {err && <div className="text-bad text-sm">{err}</div>}
            <div className="flex justify-end gap-2">
              <button className="btn-ghost" onClick={() => { setShowAdd(false); setEditingId(null); }}>Cancel</button>
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
