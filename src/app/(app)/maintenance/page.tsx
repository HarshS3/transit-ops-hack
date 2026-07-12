"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/lib/statusPill";

type Vehicle = { id: string; regNo: string; status: string };
type Log = { id: string; service: string; cost: number; status: string; vehicle: Vehicle; date: string };

export default function MaintenancePage() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vehicleId, setVehicleId] = useState("");
  const [service, setService] = useState("");
  const [cost, setCost] = useState(0);
  const [err, setErr] = useState<string | null>(null);

  async function load() {
    const [lR, vR] = await Promise.all([
      fetch("/api/maintenance").then((r) => r.json()),
      fetch("/api/vehicles").then((r) => r.json()),
    ]);
    setLogs(lR);
    setVehicles(vR);
  }
  useEffect(() => { load(); }, []);

  async function save() {
    setErr(null);
    const r = await fetch("/api/maintenance", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ vehicleId, service, cost }),
    });
    if (!r.ok) { const j = await r.json(); setErr(j.error); return; }
    setService(""); setCost(0);
    load();
  }

  async function close(id: string) {
    await fetch(`/api/maintenance/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "close" }),
    });
    load();
  }

  const availableForService = vehicles.filter((v) => v.status !== "ON_TRIP" && v.status !== "RETIRED");

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card space-y-3">
        <div className="text-sm font-semibold">Log Service Record</div>
        <F label="Vehicle">
          <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
            <option value="">Select…</option>
            {availableForService.map((v) => (
              <option key={v.id} value={v.id}>{v.regNo} ({v.status})</option>
            ))}
          </select>
        </F>
        <F label="Service Type"><input value={service} onChange={(e) => setService(e.target.value)} placeholder="Oil Change" /></F>
        <F label="Cost"><input type="number" value={cost} onChange={(e) => setCost(Number(e.target.value))} /></F>
        {err && <div className="text-bad text-sm">{err}</div>}
        <button className="btn w-full" onClick={save} disabled={!vehicleId || !service}>Save & Set In-Shop</button>

        <div className="text-xs text-muted mt-2 border-t border-[#1e2a3a] pt-3">
          <div className="mb-1 font-semibold text-text">State transitions:</div>
          <div>Available <span className="text-brand">→ In Shop</span> (on record create)</div>
          <div>In Shop <span className="text-ok">→ Available</span> (on close)</div>
          <div className="mt-1">Note: In-Shop vehicles are removed from the dispatch pool.</div>
        </div>
      </div>

      <div className="card">
        <div className="text-sm text-muted uppercase tracking-wider mb-2">Service Log</div>
        <table className="tbl">
          <thead>
            <tr><th>Vehicle</th><th>Service</th><th>Cost</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {logs.length === 0 && <tr><td colSpan={5} className="text-muted italic p-3">No records yet.</td></tr>}
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="font-medium">{l.vehicle.regNo}</td>
                <td>{l.service}</td>
                <td>₹{l.cost.toLocaleString()}</td>
                <td><StatusPill status={l.status} /></td>
                <td>
                  {l.status === "ACTIVE" && (
                    <button className="btn-ghost text-xs" onClick={() => close(l.id)}>Close</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
