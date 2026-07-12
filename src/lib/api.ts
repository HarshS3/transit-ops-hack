import { NextResponse } from "next/server";
import { readSession, canAccess } from "./auth";

export function ok(data: any, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function bad(msg: string, code = 400) {
  return NextResponse.json({ error: msg }, { status: code });
}

export async function requireUser() {
  const user = await readSession();
  if (!user) return { user: null, res: bad("Unauthorized", 401) };
  return { user, res: null as any };
}

export async function requireSection(section: string) {
  const { user, res } = await requireUser();
  if (!user) return { user: null, res };
  if (!canAccess(user.role, section)) return { user: null, res: bad("Forbidden", 403) };
  return { user, res: null as any };
}
