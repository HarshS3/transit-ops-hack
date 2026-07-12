import { prisma } from "@/lib/prisma";
import { ok, requireSection } from "@/lib/api";

export async function GET(req: Request) {
  const { user, res } = await requireSection("dashboard");
  if (!user) return res;
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const status = url.searchParams.get("status");
  const region = url.searchParams.get("region");

  const vwhere: any = {};
  if (type && type !== "ALL") vwhere.type = type;
  if (status && status !== "ALL") vwhere.status = status;
  if (region && region !== "ALL") vwhere.region = region;

  const vehicles = await prisma.vehicle.findMany({ where: vwhere });
  const vehicleIds = vehicles.map((v) => v.id);
  const drivers = await prisma.driver.findMany();
  const trips = await prisma.trip.findMany({
    where: { vehicleId: { in: vehicleIds } },
    include: { vehicle: true, driver: true },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const counts = {
    active: vehicles.filter((v) => v.status !== "RETIRED").length,
    available: vehicles.filter((v) => v.status === "AVAILABLE").length,
    onTrip: vehicles.filter((v) => v.status === "ON_TRIP").length,
    inShop: vehicles.filter((v) => v.status === "IN_SHOP").length,
    retired: vehicles.filter((v) => v.status === "RETIRED").length,
  };
  const activeTrips = await prisma.trip.count({ where: { status: "DISPATCHED" } });
  const pendingTrips = await prisma.trip.count({ where: { status: "DRAFT" } });
  const driversOnDuty = drivers.filter((d) => d.status === "ON_TRIP").length;
  const totalActive = counts.active;
  const fleetUtilization = totalActive > 0 ? Math.round((counts.onTrip / totalActive) * 100) : 0;

  return ok({
    kpis: {
      active: counts.active,
      available: counts.available,
      inMaintenance: counts.inShop,
      activeTrips,
      pendingTrips,
      driversOnDuty,
      fleetUtilization,
    },
    statusMix: counts,
    recentTrips: trips.map((t) => ({
      code: t.code,
      vehicle: t.vehicle.regNo,
      driver: t.driver.name,
      status: t.status,
      eta: t.status === "DISPATCHED" ? "45 min" : t.status === "COMPLETED" ? "—" : "Awaiting",
    })),
  });
}
