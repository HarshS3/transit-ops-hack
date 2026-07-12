import { prisma } from "@/lib/prisma";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth";
import { bad, ok } from "@/lib/api";

export async function POST(req: Request) {
  const { email, password } = await req.json();
  if (!email || !password) return bad("Email and password required");
  const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase() } });
  if (!user) return bad("Invalid credentials", 401);
  const good = await verifyPassword(password, user.passwordHash);
  if (!good) return bad("Invalid credentials", 401);
  const token = await signSession(user.id);
  await setSessionCookie(token);
  return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
}
