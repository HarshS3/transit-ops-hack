import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireSection("maintenance");
  if (!user) return res;
  const body = await req.json();
  const action = String(body.action || "close");
  const log = await prisma.maintenanceLog.findUnique({
    where: { id: params.id },
    include: { vehicle: true },
  });
  if (!log) return bad("Log not found", 404);
  if (action === "close") {
    if (log.status === "CLOSED") return bad("Already closed");
    const ops: any[] = [
      prisma.maintenanceLog.update({
        where: { id: log.id },
        data: { status: "CLOSED", closedAt: new Date() },
      }),
    ];
    // Only restore to Available if vehicle is currently In Shop (never override Retired).
    if (log.vehicle.status === "IN_SHOP") {
      ops.push(prisma.vehicle.update({ where: { id: log.vehicleId }, data: { status: "AVAILABLE" } }));
    }
    await prisma.$transaction(ops);
    return ok({ ok: true });
  }
  return bad("Unknown action");
}
