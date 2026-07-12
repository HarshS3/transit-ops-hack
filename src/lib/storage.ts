import { promises as fs } from "fs";
import path from "path";

// Local disk storage under storage/vehicle-docs/<vehicleId>/<docId>-<safeName>
export const STORAGE_ROOT = path.join(process.cwd(), "storage");

export async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

export function safeFilename(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]+/g, "_").slice(0, 120) || "file";
}

export function vehicleDocDir(vehicleId: string) {
  return path.join(STORAGE_ROOT, "vehicle-docs", vehicleId);
}

export async function writeVehicleDoc(vehicleId: string, docId: string, filename: string, buf: Buffer) {
  const dir = vehicleDocDir(vehicleId);
  await ensureDir(dir);
  const safe = safeFilename(filename);
  const filePath = path.join(dir, `${docId}-${safe}`);
  await fs.writeFile(filePath, buf);
  return { absPath: filePath, relPath: path.relative(STORAGE_ROOT, filePath).split(path.sep).join("/") };
}

export async function readAbs(relPath: string) {
  const abs = path.join(STORAGE_ROOT, relPath);
  return fs.readFile(abs);
}

export async function deleteAbs(relPath: string) {
  const abs = path.join(STORAGE_ROOT, relPath);
  try { await fs.unlink(abs); } catch {}
}
