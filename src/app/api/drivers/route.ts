import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

export async function GET(req: Request) {
  const { user, res } = await requireSection("drivers");
  if (!user) return res;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.trim();
  const where: any = q ? { OR: [{ name: { contains: q } }, { licenseNo: { contains: q } }] } : {};
  const rows = await prisma.driver.findMany({ where, orderBy: { createdAt: "desc" } });
  return ok(rows);
}

export async function POST(req: Request) {
  const { user, res } = await requireSection("drivers");
  if (!user) return res;
  const body = await req.json();
  const licenseNo = String(body.licenseNo || "").trim().toUpperCase();
  if (!licenseNo) return bad("License number is required");
  const dup = await prisma.driver.findUnique({ where: { licenseNo } });
  if (dup) return bad("License number must be unique");
  const expiry = new Date(body.licenseExpiry);
  if (isNaN(expiry.getTime())) return bad("Invalid license expiry date");
  const created = await prisma.driver.create({
    data: {
      name: String(body.name || ""),
      licenseNo,
      licenseCategory: String(body.licenseCategory || "LMV"),
      licenseExpiry: expiry,
      contact: String(body.contact || ""),
      safetyScore: Number(body.safetyScore ?? 90),
      status: String(body.status || "AVAILABLE"),
    },
  });
  return ok(created);
}
