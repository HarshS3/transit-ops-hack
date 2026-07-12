import { readSession } from "@/lib/auth";
import { ok } from "@/lib/api";

export async function GET() {
  const user = await readSession();
  if (!user) return ok({ user: null });
  return ok({ user: { id: user.id, email: user.email, name: user.name, role: user.role } });
}
