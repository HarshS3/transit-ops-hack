import { prisma } from "@/lib/prisma";
import { ok, requireUser } from "@/lib/api";

export async function GET() {
  const { user, res } = await requireUser();
  if (!user) return res;

  const now = new Date();
  const in30 = new Date(now.getTime() + 30 * 24 * 3600 * 1000);

  const drivers = await prisma.driver.findMany();
  const trips = await prisma.trip.findMany({ include: { vehicle: true, driver: true } });
  const docs = await prisma.vehicleDocument.findMany({
    where: { expiresAt: { not: null } },
    include: { vehicle: true },
  });

  const items: { id: string; severity: "info" | "warn" | "bad"; title: string; detail: string }[] = [];

  for (const d of drivers) {
    if (d.licenseExpiry < now) {
      items.push({
        id: `lic-expired-${d.id}`,
        severity: "bad",
        title: `License expired: ${d.name}`,
        detail: `Expired on ${d.licenseExpiry.toISOString().slice(0, 10)} · License ${d.licenseNo}`,
      });
    } else if (d.licenseExpiry < in30) {
      items.push({
        id: `lic-soon-${d.id}`,
        severity: "warn",
        title: `License expiring soon: ${d.name}`,
        detail: `Expires ${d.licenseExpiry.toISOString().slice(0, 10)}`,
      });
    }
  }

  for (const d of docs) {
    if (!d.expiresAt) continue;
    if (d.expiresAt < now) {
      items.push({
        id: `doc-expired-${d.id}`,
        severity: "bad",
        title: `${d.docType} expired: ${d.vehicle.regNo}`,
        detail: `${d.title} · Expired ${d.expiresAt.toISOString().slice(0, 10)}`,
      });
    } else if (d.expiresAt < in30) {
      items.push({
        id: `doc-soon-${d.id}`,
        severity: "warn",
        title: `${d.docType} expiring soon: ${d.vehicle.regNo}`,
        detail: `${d.title} · Expires ${d.expiresAt.toISOString().slice(0, 10)}`,
      });
    }
  }

  for (const t of trips) {
    if (t.status === "DISPATCHED") {
      items.push({
        id: `trip-${t.id}`,
        severity: "info",
        title: `Active trip ${t.code}`,
        detail: `${t.vehicle.regNo} · ${t.driver.name} · ${t.source} → ${t.destination}`,
      });
    }
  }

  return ok({ items, count: items.length });
}
