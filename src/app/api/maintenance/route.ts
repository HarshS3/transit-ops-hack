import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

export async function GET() {
  const { user, res } = await requireSection("maintenance");
  if (!user) return res;
  const rows = await prisma.maintenanceLog.findMany({
    include: { vehicle: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(rows);
}

export async function POST(req: Request) {
  const { user, res } = await requireSection("maintenance");
  if (!user) return res;
  const body = await req.json();
  const vehicle = await prisma.vehicle.findUnique({ where: { id: String(body.vehicleId || "") } });
  if (!vehicle) return bad("Vehicle not found");
  if (vehicle.status === "ON_TRIP") return bad("Cannot service a vehicle currently on trip");
  if (vehicle.status === "RETIRED") return bad("Vehicle is retired");
  const [log] = await prisma.$transaction([
    prisma.maintenanceLog.create({
      data: {
        vehicleId: vehicle.id,
        service: String(body.service || ""),
        cost: Number(body.cost || 0),
        status: "ACTIVE",
      },
    }),
    prisma.vehicle.update({ where: { id: vehicle.id }, data: { status: "IN_SHOP" } }),
  ]);
  return ok(log);
}
