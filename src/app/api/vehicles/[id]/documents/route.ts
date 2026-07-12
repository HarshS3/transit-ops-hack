import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";
import { writeVehicleDoc } from "@/lib/storage";
import { randomBytes } from "crypto";

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB
const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "image/webp"];

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireSection("fleet");
  if (!user) return res;
  const docs = await prisma.vehicleDocument.findMany({
    where: { vehicleId: params.id },
    orderBy: { createdAt: "desc" },
  });
  return ok(docs);
}

export async function POST(req: Request, { params }: { params: { id: string } }) {
  const { user, res } = await requireSection("fleet");
  if (!user) return res;

  const vehicle = await prisma.vehicle.findUnique({ where: { id: params.id } });
  if (!vehicle) return bad("Vehicle not found", 404);

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return bad("Expected multipart/form-data");
  }

  const file = form.get("file");
  const docType = String(form.get("docType") || "OTHER");
  const title = String(form.get("title") || "");
  const expiresAtRaw = form.get("expiresAt");
  const expiresAt = expiresAtRaw ? new Date(String(expiresAtRaw)) : null;

  if (!(file instanceof File)) return bad("No file uploaded");
  if (file.size === 0) return bad("Empty file");
  if (file.size > MAX_BYTES) return bad(`File too large (max ${MAX_BYTES / 1024 / 1024} MB)`);
  if (!ALLOWED.includes(file.type)) return bad(`Unsupported file type: ${file.type}`);

  const docId = "doc_" + randomBytes(8).toString("hex");
  const buf = Buffer.from(await file.arrayBuffer());
  const { relPath } = await writeVehicleDoc(vehicle.id, docId, file.name, buf);

  const created = await prisma.vehicleDocument.create({
    data: {
      id: docId,
      vehicleId: vehicle.id,
      docType,
      title: title || file.name,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      path: relPath,
      expiresAt: expiresAt && !isNaN(expiresAt.getTime()) ? expiresAt : null,
      uploadedBy: user.email,
    },
  });
  return ok(created);
}
