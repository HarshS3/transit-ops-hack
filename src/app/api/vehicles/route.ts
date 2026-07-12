import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

export async function GET(req: Request) {
  const { user, res } = await requireSection("fleet");
  if (!user) return res;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const type = url.searchParams.get("type") || undefined;
  const status = url.searchParams.get("status") || undefined;
  const region = url.searchParams.get("region") || undefined;
  const where: any = {};
  if (type && type !== "ALL") where.type = type;
  if (status && status !== "ALL") where.status = status;
  if (region && region !== "ALL") where.region = region;
  if (q) where.OR = [{ regNo: { contains: q } }, { name: { contains: q } }];
  const rows = await prisma.vehicle.findMany({ where, orderBy: { createdAt: "desc" } });
  return ok(rows);
}

export async function POST(req: Request) {
  const { user, res } = await requireSection("fleet");
  if (!user) return res;
  const body = await req.json();
  const regNo = String(body.regNo || "").trim().toUpperCase();
  if (!regNo) return bad("Registration number is required");
  const dup = await prisma.vehicle.findUnique({ where: { regNo } });
  if (dup) return bad("Registration number must be unique");
  const created = await prisma.vehicle.create({
    data: {
      regNo,
      name: String(body.name || ""),
      type: String(body.type || "Van"),
      capacityKg: Number(body.capacityKg || 0),
      odometer: Number(body.odometer || 0),
      acquisitionCost: Number(body.acquisitionCost || 0),
      region: String(body.region || "HQ"),
      status: String(body.status || "AVAILABLE"),
    },
  });
  return ok(created);
}
