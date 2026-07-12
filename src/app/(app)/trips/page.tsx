"use client";

import { useEffect, useMemo, useState } from "react";
import { StatusPill } from "@/lib/statusPill";

type Vehicle = { id: string; regNo: string; name: string; capacityKg: number; status: string };
type Driver = { id: string; name: string; licenseNo: string; licenseExpiry: string; status: string };
type Trip = {
  id: string; code: string; source: string; destination: string; status: string;
  cargoKg: number; plannedKm: number; actualKm: number | null; fuelUsedL: number | null;
  vehicle: Vehicle; driver: Driver;
};

export default function TripsPage() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [vehicleId, setVehicleId] = useState("");
  const [driverId, setDriverId] = useState("");
  const [cargoKg, setCargoKg] = useState<number | "">("");
  const [plannedKm, setPlannedKm] = useState<number | "">("");
  const [revenue, setRevenue] = useState<number | "">("");
  const [err, setErr] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function load() {
    const safeFetch = async (url: string) => {
      const r = await fetch(url);
      if (!r.ok) return [];
      const j = await r.json();
      return Array.isArray(j) ? j : [];
    };
    const [tR, vR, dR] = await Promise.all([
      safeFetch("/api/trips"),
      safeFetch("/api/vehicles?status=AVAILABLE"),
      safeFetch("/api/drivers"),
    ]);
    setTrips(tR);
    setVehicles(vR);
    setDrivers(dR);
  }
  useEffect(() => { load(); }, []);

  const selectedV = vehicles.find((v) => v.id === vehicleId);
  const selectedD = drivers.find((d) => d.id === driverId);
  const driverExpired = selectedD ? new Date(selectedD.licenseExpiry) < new Date() : false;
  const capacityExceeded = selectedV ? Number(cargoKg) > selectedV.capacityKg : false;
  const canDispatch =
    !!source && !!destination && !!selectedV && !!selectedD &&
    Number(cargoKg) > 0 && Number(plannedKm) > 0 &&
    selectedD.status === "AVAILABLE" && !driverExpired && !capacityExceeded;

  async function create() {
    setErr(null); setMsg(null);
    const r = await fetch("/api/trips", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ source, destination, vehicleId, driverId, cargoKg, plannedKm, revenue }),
    });
    if (!r.ok) { const j = await r.json(); setErr(j.error); return; }
    const trip = await r.json();
    setMsg(`Draft ${trip.code} created`);
    setSource(""); setDestination(""); setVehicleId(""); setDriverId(""); setCargoKg(""); setPlannedKm(""); setRevenue("");
    load();
  }

  async function action(id: string, action: string, extra?: any) {
    const r = await fetch(`/api/trips/${id}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...extra }),
    });
    if (!r.ok) { const j = await r.json(); setErr(j.error); return; }
    setErr(null);
    load();
  }

  const availableDrivers = drivers.filter((d) => d.status === "AVAILABLE" && new Date(d.licenseExpiry) >= new Date());

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="card space-y-3">
        <div className="text-xs text-muted uppercase tracking-wider">Trip Lifecycle</div>
        <div className="flex items-center gap-2 text-xs">
          {["Draft", "Dispatched", "Completed", "Cancelled"].map((s, i) => (
            <span key={s} className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-[#0e141d] border border-[#1e2a3a] flex items-center justify-center">{i + 1}</span>
              <span className="text-muted">{s}</span>
              {i < 3 && <span className="text-muted">→</span>}
            </span>
          ))}
        </div>

        <div className="text-sm font-semibold mt-2">Create Trip</div>
        <div className="grid grid-cols-2 gap-2">
          <F label="Source"><input value={source} onChange={(e) => setSource(e.target.value)} placeholder="Gandhinagar Depot" /></F>
          <F label="Destination"><input value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Ahmedabad Hub" /></F>
          <F label="Vehicle (Available only)">
            <select value={vehicleId} onChange={(e) => setVehicleId(e.target.value)}>
              <option value="">Select…</option>
              {vehicles.map((v) => (
                <option key={v.id} value={v.id}>{v.regNo} — {v.capacityKg} kg capacity</option>
              ))}
            </select>
          </F>
          <F label="Driver (Available only)">
            <select value={driverId} onChange={(e) => setDriverId(e.target.value)}>
              <option value="">Select…</option>
              {availableDrivers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </F>
          <F label="Cargo Weight (kg)">
            <input type="number" value={cargoKg} onChange={(e) => setCargoKg(e.target.value === "" ? "" : Number(e.target.value))} />
          </F>
          <F label="Planned Distance (km)">
            <input type="number" value={plannedKm} onChange={(e) => setPlannedKm(e.target.value === "" ? "" : Number(e.target.value))} />
          </F>
          <F label="Expected Revenue">
            <input type="number" value={revenue} onChange={(e) => setRevenue(e.target.value === "" ? "" : Number(e.target.value))} />
          </F>
        </div>

        {selectedV && (
          <div className={`text-sm rounded-lg p-3 ${capacityExceeded ? "border border-bad/60 bg-bad/10 text-bad" : "border border-[#1e2a3a] bg-[#0e141d] text-muted"}`}>
            <div>Vehicle Capacity: <b>{selectedV.capacityKg} kg</b></div>
            <div>Cargo Weight: <b>{cargoKg} kg</b></div>
            {capacityExceeded && <div className="mt-1 font-semibold">✕ Capacity exceeded by {cargoKg - selectedV.capacityKg} kg — dispatch blocked</div>}
          </div>
        )}
        {selectedD && driverExpired && (
          <div className="text-sm border border-bad/60 bg-bad/10 text-bad rounded-lg p-3 font-semibold">
            ✕ Driver license expired on {new Date(selectedD.licenseExpiry).toISOString().slice(0, 10)} — dispatch blocked
          </div>
        )}
        {err && <div className="text-sm text-bad">{err}</div>}
        {msg && <div className="text-sm text-ok">{msg}</div>}

        <div className="flex gap-2 justify-end">
          <button className="btn-ghost" onClick={() => { setSource(""); setDestination(""); setVehicleId(""); setDriverId(""); setCargoKg(""); setPlannedKm(""); }}>Cancel</button>
          <button className="btn" onClick={create} disabled={!canDispatch}>Create Draft</button>
        </div>
      </div>

      <div className="card">
        <div className="text-xs text-muted uppercase tracking-wider mb-2">Live Board</div>
        <div className="space-y-3">
          {trips.length === 0 && <div className="text-muted italic">No trips yet.</div>}
          {trips.map((t) => (
            <TripRow key={t.id} t={t} onAction={action} />
          ))}
        </div>
        <div className="text-xs text-muted mt-3">On Complete: odometer += actualKm, fuel logged → vehicle & driver Available.</div>
      </div>
    </div>
  );
}

function TripRow({ t, onAction }: { t: Trip; onAction: (id: string, action: string, extra?: any) => void }) {
  const [actualKm, setActualKm] = useState<number | "">(t.plannedKm);
  const [fuel, setFuel] = useState<number | "">("");

  return (
    <div className="border border-[#1e2a3a] rounded-lg p-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{t.code}: {t.source} → {t.destination}</div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{t.vehicle.regNo} / {t.driver.name}</span>
          <StatusPill status={t.status} />
        </div>
      </div>
      <div className="text-xs text-muted mt-1">
        Cargo {t.cargoKg} kg · Planned {t.plannedKm} km
      </div>

      {t.status === "DRAFT" && (
        <div className="mt-2 flex gap-2">
          <button className="btn" onClick={() => onAction(t.id, "dispatch")}>Dispatch</button>
          <button className="btn-ghost" onClick={() => onAction(t.id, "cancel")}>Cancel</button>
        </div>
      )}
      {t.status === "DISPATCHED" && (
        <div className="mt-2 grid grid-cols-3 gap-2 items-end">
          <label className="text-xs">
            <div className="text-muted mb-1">Actual km</div>
            <input type="number" value={actualKm} onChange={(e) => setActualKm(e.target.value === "" ? "" : Number(e.target.value))} />
          </label>
          <label className="text-xs">
            <div className="text-muted mb-1">Fuel used (L)</div>
            <input type="number" value={fuel} onChange={(e) => setFuel(e.target.value === "" ? "" : Number(e.target.value))} />
          </label>
          <div className="flex gap-2">
            <button className="btn" onClick={() => onAction(t.id, "complete", { actualKm: Number(actualKm), fuelUsedL: Number(fuel) })}>Complete</button>
            <button className="btn-ghost" onClick={() => onAction(t.id, "cancel")}>Cancel</button>
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
