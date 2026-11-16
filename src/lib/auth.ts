import "server-only";
import { cache } from "react";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { db } from "./db";
import { hashToken, newToken } from "./tokens";
import type { PermissionKey, RoleKeyT } from "./permissions";
import { FULL_ACCESS_ROLES } from "./permissions";

export const SESSION_COOKIE = "er_session";
const TTL_HOURS = Number(process.env.SESSION_TTL_HOURS ?? 8);

export type AuthUser = {
  id: string;
  sessionId: string;
  username: string;
  name: string;
  role: RoleKeyT;
  roleName: string;
  perms: Set<string>;
  residentId: string | null;
};

export async function clientIp() {
  const h = await headers();
  return (h.get("x-forwarded-for")?.split(",")[0] ?? h.get("x-real-ip") ?? "local").trim().slice(0, 64);
}

export async function createSession(userId: string) {
  const token = newToken();
  const h = await headers();
  const expiresAt = new Date(Date.now() + TTL_HOURS * 3600_000);
  await db.session.create({
    data: {
      userId,
      tokenHash: hashToken(token),
      expiresAt,
      ip: await clientIp(),
      userAgent: h.get("user-agent")?.slice(0, 255) ?? null,
    },
  });
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production" && !process.env.ALLOW_INSECURE_COOKIE,
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.updateMany({ where: { tokenHash: hashToken(token), revokedAt: null }, data: { revokedAt: new Date() } });
  }
  jar.delete(SESSION_COOKIE);
}

/** Pengguna semasa (sekali bagi setiap request). Kebenaran = role + tambahan − tarikan. */
export const getCurrentUser = cache(async (): Promise<AuthUser | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const session = await db.session.findUnique({
    where: { tokenHash: hashToken(token) },
    include: {
      user: {
        include: {
          role: { include: { permissions: { include: { permission: true } } } },
          permissionOverrides: { include: { permission: true } },
          resident: { select: { id: true } },
        },
      },
    },
  });
  if (!session || session.revokedAt || session.expiresAt < new Date()) return null;
  const u = session.user;
  if (u.status !== "ACTIVE") return null;

  const perms = new Set(u.role.permissions.map((rp) => rp.permission.key));
  for (const o of u.permissionOverrides) {
    if (o.granted) perms.add(o.permission.key);
    else perms.delete(o.permission.key);
  }
  if (Date.now() - session.lastSeenAt.getTime() > 5 * 60_000) {
    await db.session.update({ where: { id: session.id }, data: { lastSeenAt: new Date() } });
  }
  return {
    id: u.id,
    sessionId: session.id,
    username: u.username,
    name: u.name,
    role: u.role.key as RoleKeyT,
    roleName: u.role.name,
    perms,
    residentId: u.resident?.id ?? null,
  };
});

export function can(user: AuthUser | null, perm: PermissionKey) {
  return !!user && user.perms.has(perm);
}
export function isFullAccess(user: AuthUser) {
  return FULL_ACCESS_ROLES.includes(user.role);
}

/** Untuk halaman (server component) */
export async function requireUser() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  return u;
}
export async function requirePage(perm: PermissionKey) {
  const u = await requireUser();
  if (!can(u, perm)) redirect("/tiada-akses");
  return u;
}

// ────────────── Skop data mengikut blok & dorm ──────────────
export type Scope = { all: boolean; blockIds: string[]; dormIds: string[] };

export const getScope = cache(async (user: AuthUser): Promise<Scope> => {
  if (isFullAccess(user)) return { all: true, blockIds: [], dormIds: [] };
  let blockIds: string[] = [];
  if (user.role === "WARDEN") {
    blockIds = (await db.wardenAssignment.findMany({ where: { wardenUserId: user.id } })).map((w) => w.blockId);
  } else if (user.role === "KETUA_BLOK" || user.role === "PEN_KETUA_BLOK") {
    blockIds = (
      await db.block.findMany({ where: { OR: [{ headUserId: user.id }, { assistantUserId: user.id }] }, select: { id: true } })
    ).map((b) => b.id);
  }
  if (blockIds.length) {
    const dorms = await db.dorm.findMany({ where: { blockId: { in: blockIds } }, select: { id: true } });
    return { all: false, blockIds, dormIds: dorms.map((d) => d.id) };
  }
  if (user.role === "KETUA_DORM" || user.role === "PEN_KETUA_DORM") {
    const dorms = await db.dorm.findMany({
      where: { OR: [{ headUserId: user.id }, { assistantUserId: user.id }] },
      select: { id: true, blockId: true },
    });
    return { all: false, blockIds: [...new Set(dorms.map((d) => d.blockId))], dormIds: dorms.map((d) => d.id) };
  }
  return { all: false, blockIds: [], dormIds: [] };
});

export function inScope(scope: Scope, dormId: string) {
  return scope.all || scope.dormIds.includes(dormId);
}
export function dormFilter(scope: Scope) {
  return scope.all ? {} : { id: { in: scope.dormIds } };
}
export function blockScopeOf(scope: Scope, blockId: string) {
  return scope.all || scope.blockIds.includes(blockId);
}

// ────────────── Kata laluan ──────────────
export const hashPassword = (pw: string) => bcrypt.hash(pw, 12);
export const verifyPassword = (pw: string, hash: string) => bcrypt.compare(pw, hash);
// Hash palsu supaya masa respons sama walaupun username tidak wujud
let dummy: string | null = null;
export const dummyHash = () => (dummy ??= bcrypt.hashSync("tiada-pengguna-ini", 12));
