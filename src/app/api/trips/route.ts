import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

async function nextTripCode() {
  const count = await prisma.trip.count();
  return `TR${String(count + 1).padStart(3, "0")}`;
}

export async function GET(req: Request) {
  const { user, res } = await requireSection("trips");
  if (!user) return res;
  const url = new URL(req.url);
  const status = url.searchParams.get("status");
  const where: any = {};
  if (status && status !== "ALL") where.status = status;
  const rows = await prisma.trip.findMany({
    where,
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
  });
  return ok(rows);
}

export async function POST(req: Request) {
  const { user, res } = await requireSection("trips");
  if (!user) return res;
  const body = await req.json();

  const vehicle = await prisma.vehicle.findUnique({ where: { id: String(body.vehicleId || "") } });
  if (!vehicle) return bad("Vehicle not found");

  const driver = await prisma.driver.findUnique({ where: { id: String(body.driverId || "") } });
  if (!driver) return bad("Driver not found");

  const cargoKg = Number(body.cargoKg || 0);
  const plannedKm = Number(body.plannedKm || 0);
  if (cargoKg <= 0) return bad("Cargo weight must be > 0");
  if (plannedKm <= 0) return bad("Planned distance must be > 0");

  if (vehicle.status === "RETIRED" || vehicle.status === "IN_SHOP")
    return bad(`Vehicle is ${vehicle.status.replace("_", " ").toLowerCase()} and cannot be dispatched`);
  if (vehicle.status === "ON_TRIP") return bad("Vehicle is already on a trip");
  if (cargoKg > vehicle.capacityKg)
    return bad(`Cargo (${cargoKg} kg) exceeds capacity (${vehicle.capacityKg} kg)`);

  if (driver.status === "SUSPENDED") return bad("Driver is suspended");
  if (driver.status === "ON_TRIP") return bad("Driver is already on a trip");
  if (new Date(driver.licenseExpiry) < new Date()) return bad("Driver license is expired");

  const code = await nextTripCode();
  const trip = await prisma.trip.create({
    data: {
      code,
      source: String(body.source || ""),
      destination: String(body.destination || ""),
      vehicleId: vehicle.id,
      driverId: driver.id,
      cargoKg,
      plannedKm,
      revenue: Number(body.revenue || 0),
      status: "DRAFT",
    },
  });
  return ok(trip);
}
