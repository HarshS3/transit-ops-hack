// End-to-end smoke test for vehicle document management.
// Uses native undici in Node 20 (fetch + FormData + Blob).
import fs from "node:fs/promises";

const BASE = "http://127.0.0.1:3003";
let cookie = "";

function updateCookie(res) {
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
}
async function req(method, path, body, extraHeaders = {}) {
  const headers = { ...extraHeaders };
  if (cookie) headers["cookie"] = cookie;
  const opts = { method, headers, redirect: "manual" };
  if (body !== undefined) opts.body = body;
  const res = await fetch(`${BASE}${path}`, opts);
  updateCookie(res);
  return res;
}

async function login(email, password) {
  const r = await req("POST", "/api/auth/login", JSON.stringify({ email, password }), { "content-type": "application/json" });
  const j = await r.json();
  console.log("  login:", r.status, j.role || j.error);
  return r.ok;
}

async function main() {
  console.log("== 1. Login (fleet manager) ==");
  await login("fleet@transitops.in", "demo1234");

  console.log("\n== 2. Find vehicle GJ01AB1121 ==");
  const vehicles = await (await req("GET", "/api/vehicles")).json();
  const van = vehicles.find((v) => v.regNo === "GJ01AB1121");
  console.log("  id:", van.id);

  console.log("\n== 3. Upload insurance PDF (expiring in 20 days) ==");
  const pdf = Buffer.from("%PDF-1.4\n%demo insurance certificate\n%%EOF\n", "utf8");
  const fd = new FormData();
  fd.set("file", new Blob([pdf], { type: "application/pdf" }), "insurance.pdf");
  fd.set("docType", "INSURANCE");
  fd.set("title", "Insurance FY25-26");
  const expiresAt = new Date(Date.now() + 20 * 86400000).toISOString().slice(0, 10);
  fd.set("expiresAt", expiresAt);
  const up = await req("POST", `/api/vehicles/${van.id}/documents`, fd);
  const upJson = await up.json();
  console.log("  status:", up.status, "id:", upJson.id, "size:", upJson.sizeBytes);
  const docId = upJson.id;

  console.log("\n== 4. List documents ==");
  const list = await (await req("GET", `/api/vehicles/${van.id}/documents`)).json();
  console.log("  count:", list.length, "titles:", list.map((d) => d.title));

  console.log("\n== 5. Notifications should include expiring doc ==");
  const notif = await (await req("GET", "/api/notifications")).json();
  notif.items.forEach((i) => console.log("  [" + i.severity + "]", i.title, "—", i.detail));

  console.log("\n== 6. Download and verify content ==");
  const dl = await req("GET", `/api/vehicles/${van.id}/documents/${docId}?download=1`);
  const buf = Buffer.from(await dl.arrayBuffer());
  console.log("  status:", dl.status, "bytes:", buf.length, "matches:", buf.equals(pdf));

  console.log("\n== 7. Reject unsupported mime ==");
  const badFd = new FormData();
  badFd.set("file", new Blob([Buffer.from("MZ\x90\x00")], { type: "application/x-msdownload" }), "bad.exe");
  badFd.set("docType", "OTHER");
  const bad = await req("POST", `/api/vehicles/${van.id}/documents`, badFd);
  console.log("  status:", bad.status, await bad.json());

  console.log("\n== 8. RBAC: Financial Analyst cannot upload ==");
  await login("finance@transitops.in", "demo1234");
  const finFd = new FormData();
  finFd.set("file", new Blob([pdf], { type: "application/pdf" }), "x.pdf");
  finFd.set("docType", "RC");
  const finUp = await req("POST", `/api/vehicles/${van.id}/documents`, finFd);
  console.log("  status:", finUp.status, await finUp.json());

  console.log("\n== 9. Back as fleet, delete doc ==");
  await login("fleet@transitops.in", "demo1234");
  const del = await req("DELETE", `/api/vehicles/${van.id}/documents/${docId}`);
  console.log("  status:", del.status, await del.json());

  console.log("\n== 10. Confirm gone ==");
  const list2 = await (await req("GET", `/api/vehicles/${van.id}/documents`)).json();
  console.log("  count:", list2.length);
}

main().catch((e) => { console.error(e); process.exit(1); });
