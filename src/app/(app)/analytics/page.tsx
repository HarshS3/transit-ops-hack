"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

type A = {
  kpis: { fuelEff: number; utilization: number; opCost: number; roi: number };
  monthlyRevenue: { month: string; revenue: number }[];
  topCostliest: { regNo: string; cost: number }[];
};

export default function AnalyticsPage() {
  const [data, setData] = useState<A | null>(null);
  useEffect(() => { fetch("/api/analytics").then((r) => r.json()).then(setData); }, []);
  if (!data) return <div className="p-6 text-muted">Loading…</div>;
  const k = data.kpis;

  function exportCSV() {
    const rows = [
      ["Metric", "Value"],
      ["Fuel Efficiency (km/L)", k.fuelEff],
      ["Fleet Utilization (%)", k.utilization],
      ["Operational Cost", k.opCost],
      ["Vehicle ROI (%)", k.roi],
      [],
      ["Month", "Revenue"],
      ...data.monthlyRevenue.map((m) => [m.month, m.revenue]),
      [],
      ["Vehicle", "Cost"],
      ...data.topCostliest.map((v) => [v.regNo, v.cost]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "transitops-analytics.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Reports & Analytics</h1>
        <div className="flex gap-2 no-print">
          <button className="btn-ghost" onClick={exportCSV}>Export CSV</button>
          <button className="btn" onClick={() => window.print()}>Export PDF</button>
        </div>
      </div>
      <div className="hidden print:block text-xs text-muted">
        TransitOps · Reports & Analytics · Generated {new Date().toLocaleString()}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card label="Fuel Efficiency" value={`${k.fuelEff} km/L`} color="#22c55e" />
        <Card label="Fleet Utilization" value={`${k.utilization}%`} color="#3b82f6" />
        <Card label="Operational Cost" value={`₹${k.opCost.toLocaleString()}`} color="#f59e0b" />
        <Card label="Vehicle ROI" value={`${k.roi}%`} color="#a78bfa" />
      </div>

      <div className="text-xs text-muted">
        ROI = (Revenue − (Maintenance + Fuel)) / Acquisition Cost
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card">
          <div className="text-xs text-muted uppercase tracking-wider mb-2">Monthly Revenue</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.monthlyRevenue}>
                <CartesianGrid stroke="#1e2a3a" strokeDasharray="3 3" />
                <XAxis dataKey="month" stroke="#7d8ba1" fontSize={12} />
                <YAxis stroke="#7d8ba1" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0e141d", border: "1px solid #1e2a3a" }} />
                <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card">
          <div className="text-xs text-muted uppercase tracking-wider mb-2">Top Costliest Vehicles</div>
          <div style={{ width: "100%", height: 240 }}>
            <ResponsiveContainer>
              <BarChart data={data.topCostliest} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid stroke="#1e2a3a" strokeDasharray="3 3" />
                <XAxis type="number" stroke="#7d8ba1" fontSize={12} />
                <YAxis type="category" dataKey="regNo" stroke="#7d8ba1" fontSize={12} />
                <Tooltip contentStyle={{ background: "#0e141d", border: "1px solid #1e2a3a" }} />
                <Bar dataKey="cost" fill="#f59e0b" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="kpi">
      <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
      <div className="text-2xl font-semibold mt-1" style={{ color }}>{value}</div>
    </div>
  );
}
