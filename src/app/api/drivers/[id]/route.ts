import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireSection("drivers");
  if (!user) return res;
  const body = await req.json();
  const data: any = {};
  const fields = ["name", "licenseCategory", "contact", "safetyScore", "status"] as const;
  for (const f of fields) if (body[f] !== undefined) data[f] = body[f];
  if (body.licenseExpiry) {
    const d = new Date(body.licenseExpiry);
    if (isNaN(d.getTime())) return bad("Invalid license expiry date");
    data.licenseExpiry = d;
  }
  if (data.safetyScore !== undefined) data.safetyScore = Number(data.safetyScore);
  const v = await prisma.driver.update({ where: { id: params.id }, data });
  return ok(v);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireSection("drivers");
  if (!user) return res;
  try {
    await prisma.driver.delete({ where: { id: params.id } });
    return ok({ ok: true });
  } catch {
    return bad("Cannot delete driver with related trips");
  }
}
