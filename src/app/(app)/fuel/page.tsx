"use client";

import { useEffect, useState } from "react";

type Vehicle = { id: string; regNo: string };
type FuelLog = { id: string; vehicle: Vehicle; tripCode: string | null; liters: number; cost: number; date: string };
type Expense = { id: string; vehicle: Vehicle; tripCode: string | null; category: string; amount: number; date: string; notes: string | null };

export default function FuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [fuel, setFuel] = useState<FuelLog[]>([]);
  const [exp, setExp] = useState<Expense[]>([]);
  const [showFuel, setShowFuel] = useState(false);
  const [showExp, setShowExp] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const [fForm, setFForm] = useState({ vehicleId: "", liters: 0, cost: 0, tripCode: "" });
  const [eForm, setEForm] = useState({ vehicleId: "", category: "TOLL", amount: 0, tripCode: "", notes: "" });

  async function load() {
    const [vR, fR, eR] = await Promise.all([
      fetch("/api/vehicles").then((r) => r.json()),
      fetch("/api/fuel").then((r) => r.json()),
      fetch("/api/expenses").then((r) => r.json()),
    ]);
    setVehicles(vR); setFuel(fR); setExp(eR);
  }
  useEffect(() => { load(); }, []);

  async function saveFuel() {
    setErr(null);
    const r = await fetch("/api/fuel", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(fForm) });
    if (!r.ok) { const j = await r.json(); setErr(j.error); return; }
    setFForm({ vehicleId: "", liters: 0, cost: 0, tripCode: "" }); setShowFuel(false); load();
  }
  async function saveExp() {
    setErr(null);
    const r = await fetch("/api/expenses", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(eForm) });
    if (!r.ok) { const j = await r.json(); setErr(j.error); return; }
    setEForm({ vehicleId: "", category: "TOLL", amount: 0, tripCode: "", notes: "" }); setShowExp(false); load();
  }

  const totalFuel = fuel.reduce((s, f) => s + f.cost, 0);
  const totalExp = exp.reduce((s, e) => s + e.amount, 0);
  const totalOp = totalFuel + totalExp;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Fuel & Expense Management</h1>
        <div className="flex gap-2">
          <button className="btn" onClick={() => setShowFuel(true)}>+ Log Fuel</button>
          <button className="btn-ghost" onClick={() => setShowExp(true)}>+ Add Expense</button>
        </div>
      </div>

      <div className="card">
        <div className="text-xs text-muted uppercase tracking-wider mb-2">Fuel Logs</div>
        <table className="tbl">
          <thead><tr><th>Trip</th><th>Vehicle</th><th>Date</th><th>Liters</th><th>Cost</th></tr></thead>
          <tbody>
            {fuel.length === 0 && <tr><td colSpan={5} className="text-muted italic p-3">No fuel logs.</td></tr>}
            {fuel.map((f) => (
              <tr key={f.id}>
                <td>{f.tripCode || "—"}</td>
                <td>{f.vehicle.regNo}</td>
                <td>{new Date(f.date).toISOString().slice(0, 10)}</td>
                <td>{f.liters} L</td>
                <td>₹{f.cost.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="text-xs text-muted uppercase tracking-wider mb-2">Other Expenses (Toll / Misc)</div>
        <table className="tbl">
          <thead><tr><th>Trip</th><th>Vehicle</th><th>Category</th><th>Amount</th><th>Notes</th></tr></thead>
          <tbody>
            {exp.length === 0 && <tr><td colSpan={5} className="text-muted italic p-3">No expenses.</td></tr>}
            {exp.map((e) => (
              <tr key={e.id}>
                <td>{e.tripCode || "—"}</td>
                <td>{e.vehicle.regNo}</td>
                <td>{e.category}</td>
                <td>₹{e.amount.toLocaleString()}</td>
                <td className="text-muted">{e.notes}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="mt-3 text-sm text-right border-t border-[#1e2a3a] pt-3">
          Total Operational Cost (auto) = <span className="text-brand font-semibold">₹{totalOp.toLocaleString()}</span> ·
          <span className="text-muted ml-2">Fuel ₹{totalFuel.toLocaleString()} + Other ₹{totalExp.toLocaleString()}</span>
        </div>
      </div>

      {showFuel && (
        <Modal title="Log Fuel" onClose={() => setShowFuel(false)}>
          <F label="Vehicle">
            <select value={fForm.vehicleId} onChange={(e) => setFForm({ ...fForm, vehicleId: e.target.value })}>
              <option value="">Select…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNo}</option>)}
            </select>
          </F>
          <F label="Trip Code (optional)"><input value={fForm.tripCode} onChange={(e) => setFForm({ ...fForm, tripCode: e.target.value })} /></F>
          <F label="Liters"><input type="number" value={fForm.liters} onChange={(e) => setFForm({ ...fForm, liters: Number(e.target.value) })} /></F>
          <F label="Cost"><input type="number" value={fForm.cost} onChange={(e) => setFForm({ ...fForm, cost: Number(e.target.value) })} /></F>
          {err && <div className="text-bad text-sm">{err}</div>}
          <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setShowFuel(false)}>Cancel</button><button className="btn" onClick={saveFuel}>Save</button></div>
        </Modal>
      )}

      {showExp && (
        <Modal title="Add Expense" onClose={() => setShowExp(false)}>
          <F label="Vehicle">
            <select value={eForm.vehicleId} onChange={(e) => setEForm({ ...eForm, vehicleId: e.target.value })}>
              <option value="">Select…</option>
              {vehicles.map((v) => <option key={v.id} value={v.id}>{v.regNo}</option>)}
            </select>
          </F>
          <F label="Category">
            <select value={eForm.category} onChange={(e) => setEForm({ ...eForm, category: e.target.value })}>
              <option>TOLL</option><option>MISC</option><option>OTHER</option>
            </select>
          </F>
          <F label="Trip Code (optional)"><input value={eForm.tripCode} onChange={(e) => setEForm({ ...eForm, tripCode: e.target.value })} /></F>
          <F label="Amount"><input type="number" value={eForm.amount} onChange={(e) => setEForm({ ...eForm, amount: Number(e.target.value) })} /></F>
          <F label="Notes"><input value={eForm.notes} onChange={(e) => setEForm({ ...eForm, notes: e.target.value })} /></F>
          {err && <div className="text-bad text-sm">{err}</div>}
          <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={() => setShowExp(false)}>Cancel</button><button className="btn" onClick={saveExp}>Save</button></div>
        </Modal>
      )}
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

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-md space-y-3">
        <div className="flex justify-between items-center">
          <div className="font-semibold">{title}</div>
          <button onClick={onClose} className="text-muted">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
