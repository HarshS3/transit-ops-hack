import { prisma } from "@/lib/prisma";
import { bad, ok, requireSection } from "@/lib/api";
import { deleteAbs, readAbs } from "@/lib/storage";

export async function GET(req: Request, { params }: { params: { id: string; docId: string } }) {
  const { user, res } = await requireSection("fleet");
  if (!user) return res;
  const doc = await prisma.vehicleDocument.findUnique({ where: { id: params.docId } });
  if (!doc || doc.vehicleId !== params.id) return bad("Not found", 404);
  const buf = await readAbs(doc.path);
  const url = new URL(req.url);
  const disposition = url.searchParams.get("download") ? "attachment" : "inline";
  return new Response(buf, {
    headers: {
      "content-type": doc.mimeType,
      "content-length": String(doc.sizeBytes),
      "content-disposition": `${disposition}; filename="${doc.fileName.replace(/"/g, "")}"`,
      "cache-control": "private, max-age=0",
    },
  });
}

export async function DELETE(_: Request, { params }: { params: { id: string; docId: string } }) {
  const { user, res } = await requireSection("fleet");
  if (!user) return res;
  const doc = await prisma.vehicleDocument.findUnique({ where: { id: params.docId } });
  if (!doc || doc.vehicleId !== params.id) return bad("Not found", 404);
  await prisma.vehicleDocument.delete({ where: { id: doc.id } });
  await deleteAbs(doc.path);
  return ok({ ok: true });
}
