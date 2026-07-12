import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

export async function GET() {
  const { user, res } = await requireSection("fuel");
  if (!user) return res;
  const rows = await prisma.fuelLog.findMany({
    include: { vehicle: true },
    orderBy: { date: "desc" },
  });
  return ok(rows);
}

export async function POST(req: Request) {
  const { user, res } = await requireSection("fuel");
  if (!user) return res;
  const body = await req.json();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: String(body.vehicleId || "") } });
  if (!vehicle) return bad("Vehicle not found");
  const liters = Number(body.liters || 0);
  const cost = Number(body.cost || 0);
  if (liters <= 0) return bad("Liters must be > 0");
  const created = await prisma.fuelLog.create({
    data: {
      vehicleId: vehicle.id,
      tripCode: body.tripCode || null,
      liters,
      cost,
    },
  });
  return ok(created);
}
