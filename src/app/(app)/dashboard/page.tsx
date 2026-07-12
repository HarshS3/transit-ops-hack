"use client";

import { useEffect, useState } from "react";
import { StatusPill } from "@/lib/statusPill";

type DashData = {
  kpis: { active: number; available: number; inMaintenance: number; activeTrips: number; pendingTrips: number; driversOnDuty: number; fleetUtilization: number };
  statusMix: { available: number; onTrip: number; inShop: number; retired: number };
  recentTrips: { code: string; vehicle: string; driver: string; status: string; eta: string }[];
};

export default function DashboardPage() {
  const [data, setData] = useState<DashData | null>(null);
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [region, setRegion] = useState("ALL");

  async function load() {
    const q = new URLSearchParams({ type, status, region });
    const r = await fetch(`/api/dashboard?${q}`);
    setData(await r.json());
  }
  useEffect(() => { load(); }, [type, status, region]);

  if (!data) return <div className="p-6 text-muted">Loading…</div>;
  const k = data.kpis;
  const totalMix = data.statusMix.available + data.statusMix.onTrip + data.statusMix.inShop + data.statusMix.retired || 1;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <div className="flex gap-2">
          <select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="ALL">Vehicle Type: All</option>
            <option>Van</option><option>Truck</option><option>Mini</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="ALL">Status: All</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="IN_SHOP">In Shop</option>
            <option value="RETIRED">Retired</option>
          </select>
          <select value={region} onChange={(e) => setRegion(e.target.value)}>
            <option value="ALL">Region: All</option>
            <option>HQ</option><option>North</option><option>South</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <Kpi label="Active Vehicles" value={k.active} />
        <Kpi label="Available Vehicles" value={k.available} />
        <Kpi label="Vehicles in Maintenance" value={k.inMaintenance} />
        <Kpi label="Active Trips" value={k.activeTrips} />
        <Kpi label="Pending Trips" value={k.pendingTrips} />
        <Kpi label="Drivers On Duty" value={k.driversOnDuty} />
        <Kpi label="Fleet Utilization" value={`${k.fleetUtilization}%`} accent />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card lg:col-span-2">
          <div className="text-sm text-muted mb-2 uppercase tracking-wider">Recent Trips</div>
          <table className="tbl">
            <thead><tr><th>Trip</th><th>Vehicle</th><th>Driver</th><th>Status</th><th>ETA</th></tr></thead>
            <tbody>
              {data.recentTrips.length === 0 && (
                <tr><td colSpan={5} className="text-muted italic">No trips yet</td></tr>
              )}
              {data.recentTrips.map((t) => (
                <tr key={t.code}>
                  <td className="font-medium">{t.code}</td>
                  <td>{t.vehicle}</td>
                  <td>{t.driver}</td>
                  <td><StatusPill status={t.status} /></td>
                  <td className="text-muted">{t.eta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="card">
          <div className="text-sm text-muted mb-2 uppercase tracking-wider">Vehicle Status</div>
          <MixBar label="Available" pct={data.statusMix.available / totalMix} color="#22c55e" val={data.statusMix.available} />
          <MixBar label="On Trip" pct={data.statusMix.onTrip / totalMix} color="#3b82f6" val={data.statusMix.onTrip} />
          <MixBar label="In Shop" pct={data.statusMix.inShop / totalMix} color="#f59e0b" val={data.statusMix.inShop} />
          <MixBar label="Retired" pct={data.statusMix.retired / totalMix} color="#ef4444" val={data.statusMix.retired} />
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, accent }: { label: string; value: any; accent?: boolean }) {
  return (
    <div className="kpi">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className={`text-2xl font-semibold mt-1 ${accent ? "text-brand" : ""}`}>{value}</div>
    </div>
  );
}

function MixBar({ label, pct, color, val }: { label: string; pct: number; color: string; val: number }) {
  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs text-muted mb-1"><span>{label}</span><span>{val}</span></div>
      <div className="h-2 rounded bg-[#0e141d] overflow-hidden">
        <div className="h-full" style={{ width: `${Math.max(pct * 100, 2)}%`, background: color }} />
      </div>
    </div>
  );
}
