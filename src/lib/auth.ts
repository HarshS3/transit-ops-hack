import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { RBAC } from "./rbac";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "transitops-hackathon-secret-change-me"
);
const COOKIE = "transitops_session";

export const ROLES = {
  FLEET_MANAGER: "FLEET_MANAGER",
  DISPATCHER: "DISPATCHER",
  SAFETY_OFFICER: "SAFETY_OFFICER",
  FINANCIAL_ANALYST: "FINANCIAL_ANALYST",
} as const;
export type Role = keyof typeof ROLES;

export { RBAC };

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function signSession(userId: string) {
  return await new SignJWT({ uid: userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("12h")
    .sign(SECRET);
}

export async function readSession() {
  const jar = cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    const uid = payload.uid as string;
    if (!uid) return null;
    const user = await prisma.user.findUnique({ where: { id: uid } });
    return user;
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
}

export function clearSessionCookie() {
  cookies().delete(COOKIE);
}

export function canAccess(role: string | undefined, section: string) {
  if (!role) return false;
  return (RBAC[role] || []).includes(section);
}
