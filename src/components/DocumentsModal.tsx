"use client";

import { useEffect, useRef, useState } from "react";

type Doc = {
  id: string;
  docType: string;
  title: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  expiresAt: string | null;
  uploadedBy: string | null;
  createdAt: string;
};

const DOC_TYPES = ["RC", "INSURANCE", "PUC", "PERMIT", "FITNESS", "OTHER"];

export default function DocumentsModal({
  vehicleId,
  vehicleRegNo,
  onClose,
}: {
  vehicleId: string;
  vehicleRegNo: string;
  onClose: () => void;
}) {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [docType, setDocType] = useState("RC");
  const [title, setTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch(`/api/vehicles/${vehicleId}/documents`);
    if (r.ok) setDocs(await r.json());
  }
  useEffect(() => { load(); }, [vehicleId]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    const file = fileRef.current?.files?.[0];
    if (!file) { setErr("Choose a file"); return; }
    const fd = new FormData();
    fd.append("file", file);
    fd.append("docType", docType);
    if (title) fd.append("title", title);
    if (expiresAt) fd.append("expiresAt", expiresAt);
    setBusy(true);
    const r = await fetch(`/api/vehicles/${vehicleId}/documents`, { method: "POST", body: fd });
    setBusy(false);
    if (!r.ok) { const j = await r.json().catch(() => ({})); setErr(j.error || "Upload failed"); return; }
    setTitle(""); setExpiresAt(""); if (fileRef.current) fileRef.current.value = "";
    load();
  }

  async function remove(id: string) {
    if (!confirm("Delete this document?")) return;
    const r = await fetch(`/api/vehicles/${vehicleId}/documents/${id}`, { method: "DELETE" });
    if (r.ok) load();
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="card w-full max-w-2xl space-y-3 max-h-[90vh] overflow-auto">
        <div className="flex justify-between items-center">
          <div>
            <div className="font-semibold">Documents · {vehicleRegNo}</div>
            <div className="text-xs text-muted">RC, insurance, PUC, permit, fitness — track expiry, upload PDFs or images</div>
          </div>
          <button onClick={onClose} className="text-muted">✕</button>
        </div>

        <form onSubmit={upload} className="grid grid-cols-1 md:grid-cols-2 gap-2 border border-[#1e2a3a] rounded-lg p-3">
          <F label="Doc Type">
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((t) => <option key={t}>{t}</option>)}
            </select>
          </F>
          <F label="Title (optional)"><input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Insurance 2026-27" /></F>
          <F label="Expires On (optional)"><input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} /></F>
          <F label="File (PDF/PNG/JPG, ≤8 MB)"><input ref={fileRef} type="file" accept="application/pdf,image/png,image/jpeg,image/webp" /></F>
          <div className="md:col-span-2 flex items-center justify-between">
            {err ? <div className="text-bad text-sm">{err}</div> : <div />}
            <button className="btn" disabled={busy}>{busy ? "Uploading…" : "Upload"}</button>
          </div>
        </form>

        <div>
          <div className="text-xs text-muted uppercase tracking-wider mb-2">Files ({docs.length})</div>
          {docs.length === 0 && <div className="text-muted italic text-sm">No documents yet.</div>}
          <ul className="space-y-2">
            {docs.map((d) => {
              const expiring = d.expiresAt && new Date(d.expiresAt) < new Date(Date.now() + 30 * 86400_000);
              const expired = d.expiresAt && new Date(d.expiresAt) < new Date();
              return (
                <li key={d.id} className="border border-[#1e2a3a] rounded-lg p-2 flex items-center gap-3 text-sm">
                  <span className="badge badge-info">{d.docType}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{d.title}</div>
                    <div className="text-xs text-muted truncate">
                      {d.fileName} · {(d.sizeBytes / 1024).toFixed(1)} KB
                      {d.expiresAt && (
                        <> · Expires <span className={expired ? "text-bad font-semibold" : expiring ? "text-warn font-semibold" : ""}>
                          {new Date(d.expiresAt).toISOString().slice(0, 10)}
                        </span>{expired ? " (EXPIRED)" : expiring ? " (soon)" : ""}</>
                      )}
                    </div>
                  </div>
                  <a className="btn-ghost text-xs" href={`/api/vehicles/${vehicleId}/documents/${d.id}`} target="_blank" rel="noreferrer">View</a>
                  <a className="btn-ghost text-xs" href={`/api/vehicles/${vehicleId}/documents/${d.id}?download=1`}>Download</a>
                  <button className="btn-danger text-xs !py-1" onClick={() => remove(d.id)}>Delete</button>
                </li>
              );
            })}
          </ul>
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
