"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const DEMO = [
  { label: "Fleet Manager", email: "fleet@transitops.in", pw: "demo1234" },
  { label: "Dispatcher", email: "dispatch@transitops.in", pw: "demo1234" },
  { label: "Safety Officer", email: "safety@transitops.in", pw: "demo1234" },
  { label: "Financial Analyst", email: "finance@transitops.in", pw: "demo1234" },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("fleet@transitops.in");
  const [password, setPassword] = useState("demo1234");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    const r = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    setBusy(false);
    if (!r.ok) {
      const j = await r.json().catch(() => ({}));
      setErr(j.error || "Login failed");
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-2">
      <div className="hidden md:flex flex-col justify-between p-10 bg-[#0e141d] border-r border-[#1e2a3a]">
        <div>
          <div className="w-10 h-10 rounded-md bg-brand" />
          <h1 className="mt-6 text-3xl font-bold">TransitOps</h1>
          <p className="text-muted mt-1">Smart Transport Operations Platform</p>
        </div>
        <div className="text-sm text-muted space-y-2">
          <p className="font-medium text-text">One login, four roles:</p>
          <ul className="space-y-1 pl-1">
            <li>• <span className="text-brand">Fleet Manager</span> → Fleet, Maintenance</li>
            <li>• <span className="text-brand">Dispatcher</span> → Dashboard, Trips</li>
            <li>• <span className="text-brand">Safety Officer</span> → Drivers, Compliance</li>
            <li>• <span className="text-brand">Financial Analyst</span> → Fuel & Expenses, Analytics</li>
          </ul>
        </div>
        <div className="text-xs text-muted">TransitOps © 2026 · RBAC enabled</div>
      </div>

      <div className="flex items-center justify-center p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-4">
          <h2 className="text-xl font-semibold">Sign in to your account</h2>
          <p className="text-sm text-muted">Enter your credentials to continue</p>

          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Email</label>
            <input
              className="w-full mt-1"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@transitops.in"
              required
            />
          </div>

          <div>
            <label className="text-xs text-muted uppercase tracking-wider">Password</label>
            <input
              className="w-full mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted">
              <input type="checkbox" defaultChecked className="w-3 h-3" /> Remember me
            </label>
            <a className="text-brand hover:underline" href="#">Forgot password?</a>
          </div>

          <button className="btn w-full" disabled={busy}>
            {busy ? "Signing in…" : "Sign In"}
          </button>

          {err && (
            <div className="border border-dashed border-bad/60 bg-bad/10 text-bad text-sm rounded-lg p-3">
              <div className="font-semibold">Error</div>
              <div>{err}</div>
            </div>
          )}

          <div className="pt-2 text-xs text-muted space-y-1">
            <div className="font-semibold text-text">Quick sign-in (demo):</div>
            <div className="grid grid-cols-2 gap-1">
              {DEMO.map((d) => (
                <button
                  key={d.email}
                  type="button"
                  onClick={() => { setEmail(d.email); setPassword(d.pw); }}
                  className="btn-ghost !py-1 !px-2 text-left text-xs"
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
