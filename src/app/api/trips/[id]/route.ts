import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

// Actions: dispatch | complete | cancel
export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireSection("trips");
  if (!user) return res;
  const body = await req.json();
  const action = String(body.action || "");
  const trip = await prisma.trip.findUnique({
    where: { id: params.id },
    include: { vehicle: true, driver: true },
  });
  if (!trip) return bad("Trip not found", 404);

  if (action === "dispatch") {
    if (trip.status !== "DRAFT") return bad(`Trip already ${trip.status.toLowerCase()}`);
    if (trip.vehicle.status !== "AVAILABLE") return bad(`Vehicle is ${trip.vehicle.status}`);
    if (trip.driver.status !== "AVAILABLE") return bad(`Driver is ${trip.driver.status}`);
    if (new Date(trip.driver.licenseExpiry) < new Date()) return bad("Driver license is expired");
    if (trip.cargoKg > trip.vehicle.capacityKg)
      return bad(`Cargo (${trip.cargoKg} kg) exceeds capacity (${trip.vehicle.capacityKg} kg)`);

    const [, , updated] = await prisma.$transaction([
      prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "ON_TRIP" } }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: "ON_TRIP" } }),
      prisma.trip.update({
        where: { id: trip.id },
        data: { status: "DISPATCHED", dispatchedAt: new Date() },
      }),
    ]);
    return ok(updated);
  }

  if (action === "complete") {
    if (trip.status !== "DISPATCHED") return bad("Only dispatched trips can be completed");
    const actualKm = Number(body.actualKm || trip.plannedKm);
    const fuelUsedL = Number(body.fuelUsedL || 0);
    const revenue = body.revenue !== undefined ? Number(body.revenue) : trip.revenue;

    const ops: any[] = [
      prisma.vehicle.update({
        where: { id: trip.vehicleId },
        data: { status: "AVAILABLE", odometer: trip.vehicle.odometer + actualKm },
      }),
      prisma.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } }),
      prisma.trip.update({
        where: { id: trip.id },
        data: { status: "COMPLETED", completedAt: new Date(), actualKm, fuelUsedL, revenue },
      }),
    ];
    if (fuelUsedL > 0) {
      ops.push(
        prisma.fuelLog.create({
          data: {
            vehicleId: trip.vehicleId,
            tripCode: trip.code,
            liters: fuelUsedL,
            cost: fuelUsedL * (Number(body.fuelPricePerL) || 100),
          },
        })
      );
    }
    await prisma.$transaction(ops);
    return ok({ ok: true });
  }

  if (action === "cancel") {
    if (trip.status === "COMPLETED" || trip.status === "CANCELLED")
      return bad(`Trip is ${trip.status.toLowerCase()}`);
    const ops: any[] = [
      prisma.trip.update({ where: { id: trip.id }, data: { status: "CANCELLED" } }),
    ];
    if (trip.status === "DISPATCHED") {
      ops.push(
        prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: "AVAILABLE" } }),
        prisma.driver.update({ where: { id: trip.driverId }, data: { status: "AVAILABLE" } })
      );
    }
    await prisma.$transaction(ops);
    return ok({ ok: true });
  }

  return bad("Unknown action");
}
