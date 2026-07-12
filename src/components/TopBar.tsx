"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

type Item = { id: string; severity: "info" | "warn" | "bad"; title: string; detail: string };

export default function TopBar({ user }: { user: { name: string; role: string } }) {
  const roleLabel: Record<string, string> = {
    FLEET_MANAGER: "Fleet Manager",
    DISPATCHER: "Dispatcher",
    SAFETY_OFFICER: "Safety Officer",
    FINANCIAL_ANALYST: "Financial Analyst",
  };

  const [items, setItems] = useState<Item[]>([]);
  const [open, setOpen] = useState(false);

  async function load() {
    try {
      const r = await fetch("/api/notifications");
      const j = await r.json();
      setItems(j.items || []);
    } catch {}
  }
  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, []);

  const urgent = items.filter((i) => i.severity === "bad").length;

  return (
    <header className="h-14 px-4 flex items-center justify-between border-b border-[#1e2a3a] bg-[#0b0f14]">
      <input className="w-72" placeholder="Search…" />
      <div className="flex items-center gap-3 text-sm">
        <div className="relative">
          <button
            onClick={() => setOpen((o) => !o)}
            className="btn-ghost !px-2 !py-1 relative"
            aria-label="Notifications"
          >
            🔔 <span className="ml-1">{items.length}</span>
            {urgent > 0 && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-bad" />
            )}
          </button>
          {open && (
            <div className="absolute right-0 mt-2 w-80 card z-50 max-h-96 overflow-auto">
              <div className="text-xs text-muted uppercase tracking-wider mb-2">
                Notifications ({items.length})
              </div>
              {items.length === 0 && <div className="text-muted italic text-sm">All clear.</div>}
              <ul className="space-y-2">
                {items.map((i) => (
                  <li
                    key={i.id}
                    className={clsx(
                      "text-xs rounded-lg p-2 border",
                      i.severity === "bad" && "border-bad/60 bg-bad/10",
                      i.severity === "warn" && "border-warn/60 bg-warn/10",
                      i.severity === "info" && "border-info/60 bg-info/10"
                    )}
                  >
                    <div className="font-semibold text-text">{i.title}</div>
                    <div className="text-muted">{i.detail}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <span className="text-muted">{user.name}</span>
        <span className="badge badge-warn">{roleLabel[user.role] || user.role}</span>
      </div>
    </header>
  );
}
