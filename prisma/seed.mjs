import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding TransitOps…");

  // Users
  const pw = await bcrypt.hash("demo1234", 10);
  const users = [
    { email: "fleet@transitops.in", name: "Ravi Kumar", role: "FLEET_MANAGER" },
    { email: "dispatch@transitops.in", name: "Priya Shah", role: "DISPATCHER" },
    { email: "safety@transitops.in", name: "Anil Verma", role: "SAFETY_OFFICER" },
    { email: "finance@transitops.in", name: "Meera Iyer", role: "FINANCIAL_ANALYST" },
  ];
  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: pw },
    });
  }

  // Vehicles
  const vehicles = [
    { regNo: "GJ01AB1121", name: "Van-05", type: "Van", capacityKg: 500, odometer: 74000, acquisitionCost: 620000, status: "AVAILABLE", region: "HQ" },
    { regNo: "GJ01BM1981", name: "TRUCK-8", type: "Truck", capacityKg: 5000, odometer: 182000, acquisitionCost: 2450000, status: "ON_TRIP", region: "North" },
    { regNo: "GJ01BB120", name: "MINI-03", type: "Mini", capacityKg: 1000, odometer: 66000, acquisitionCost: 410000, status: "IN_SHOP", region: "HQ" },
    { regNo: "GJ01BC0187", name: "VAN-09", type: "Van", capacityKg: 750, odometer: 214000, acquisitionCost: 540000, status: "RETIRED", region: "South" },
    { regNo: "GJ01CD4404", name: "TRUCK-4", type: "Truck", capacityKg: 8000, odometer: 90000, acquisitionCost: 3100000, status: "AVAILABLE", region: "North" },
  ];
  for (const v of vehicles) {
    await prisma.vehicle.upsert({ where: { regNo: v.regNo }, update: v, create: v });
  }

  const vs = await prisma.vehicle.findMany();
  const vMap = Object.fromEntries(vs.map((v) => [v.regNo, v]));

  // Drivers
  const drivers = [
    { name: "Alex Fernandes", licenseNo: "DL-9928", licenseCategory: "LMV", licenseExpiry: new Date("2028-12-31"), contact: "9876543210", safetyScore: 96, status: "AVAILABLE" },
    { name: "John D'Souza", licenseNo: "DL-4420", licenseCategory: "HMV", licenseExpiry: new Date("2025-03-01"), contact: "9822012345", safetyScore: 82, status: "SUSPENDED" },
    { name: "Priya Nair", licenseNo: "DL-7701", licenseCategory: "LMV", licenseExpiry: new Date("2027-08-15"), contact: "9911001100", safetyScore: 91, status: "ON_TRIP" },
    { name: "Suresh Patel", licenseNo: "DL-9004", licenseCategory: "HAZ", licenseExpiry: new Date("2027-01-05"), contact: "9944012341", safetyScore: 88, status: "AVAILABLE" },
  ];
  for (const d of drivers) {
    await prisma.driver.upsert({ where: { licenseNo: d.licenseNo }, update: d, create: d });
  }

  const ds = await prisma.driver.findMany();
  const dMap = Object.fromEntries(ds.map((d) => [d.licenseNo, d]));

  // Trips
  const van = vMap["GJ01AB1121"];
  const truck = vMap["GJ01BM1981"];
  const alex = dMap["DL-9928"];
  const priya = dMap["DL-7701"];

  const existing = await prisma.trip.count();
  if (existing === 0) {
    await prisma.trip.create({
      data: {
        code: "TR001", source: "Gandhinagar Depot", destination: "Ahmedabad Hub",
        vehicleId: van.id, driverId: alex.id, cargoKg: 450, plannedKm: 40, actualKm: 42, fuelUsedL: 5,
        revenue: 4500, status: "COMPLETED", dispatchedAt: new Date(Date.now() - 86400000), completedAt: new Date(Date.now() - 82800000),
      },
    });
    await prisma.trip.create({
      data: {
        code: "TR002", source: "Ahmedabad", destination: "Vadodara",
        vehicleId: truck.id, driverId: priya.id, cargoKg: 3200, plannedKm: 110, revenue: 18000,
        status: "DISPATCHED", dispatchedAt: new Date(Date.now() - 3600000),
      },
    });
    await prisma.trip.create({
      data: {
        code: "TR003", source: "Vatva Industrial Area", destination: "Sanand Warehouse",
        vehicleId: van.id, driverId: alex.id, cargoKg: 300, plannedKm: 55, revenue: 6000,
        status: "DRAFT",
      },
    });
  }

  // Maintenance
  const mini = vMap["GJ01BB120"];
  const activeMaint = await prisma.maintenanceLog.findFirst({ where: { vehicleId: mini.id, status: "ACTIVE" } });
  if (!activeMaint) {
    await prisma.maintenanceLog.create({
      data: { vehicleId: mini.id, service: "Tyre Replace", cost: 6200, status: "ACTIVE" },
    });
  }

  // Fuel logs / expenses
  if ((await prisma.fuelLog.count()) === 0) {
    await prisma.fuelLog.createMany({
      data: [
        { vehicleId: van.id, tripCode: "TR001", liters: 42, cost: 3150 },
        { vehicleId: truck.id, tripCode: "TR002", liters: 80, cost: 9400 },
        { vehicleId: mini.id, liters: 28, cost: 2050 },
      ],
    });
  }
  if ((await prisma.expense.count()) === 0) {
    await prisma.expense.createMany({
      data: [
        { vehicleId: van.id, tripCode: "TR001", category: "TOLL", amount: 120, notes: "NH-8" },
        { vehicleId: truck.id, tripCode: "TR002", category: "TOLL", amount: 340, notes: "NH-48" },
        { vehicleId: mini.id, category: "MISC", amount: 18000, notes: "Insurance renewal" },
      ],
    });
  }

  console.log("✓ Seed complete.");
  console.log("Login with any of:");
  users.forEach((u) => console.log(`  ${u.email} / demo1234  (${u.role})`));
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
