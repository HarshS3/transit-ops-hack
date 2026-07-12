import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";

export async function GET() {
  const { user, res } = await requireSection("fuel");
  if (!user) return res;
  const rows = await prisma.expense.findMany({
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
  const amount = Number(body.amount || 0);
  if (amount <= 0) return bad("Amount must be > 0");
  const created = await prisma.expense.create({
    data: {
      vehicleId: vehicle.id,
      tripCode: body.tripCode || null,
      category: String(body.category || "MISC"),
      amount,
      notes: body.notes || null,
    },
  });
  return ok(created);
}
