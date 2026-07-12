import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireSection("fleet");
  if (!user) return res;
  const body = await req.json();
  const data: any = {};
  const fields = ["name", "type", "capacityKg", "odometer", "acquisitionCost", "region", "status"] as const;
  for (const f of fields) if (body[f] !== undefined) data[f] = body[f];
  if (data.capacityKg !== undefined) data.capacityKg = Number(data.capacityKg);
  if (data.odometer !== undefined) data.odometer = Number(data.odometer);
  if (data.acquisitionCost !== undefined) data.acquisitionCost = Number(data.acquisitionCost);
  const v = await prisma.vehicle.update({ where: { id: params.id }, data });
  return ok(v);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireSection("fleet");
  if (!user) return res;
  try {
    await prisma.vehicle.delete({ where: { id: params.id } });
    return ok({ ok: true });
  } catch (e: any) {
    return bad("Cannot delete vehicle with related records");
  }
}
