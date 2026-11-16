import "server-only";
import { z } from "zod";
import { db } from "./db";
import { clientIp, createSession, dummyHash, verifyPassword } from "./auth";
import { audit } from "./audit";
import { FULL_ACCESS_ROLES, type RoleKeyT } from "./permissions";

export type Portal = "umum" | "admin";
export type LoginResult = { error: string } | { ok: true };

const schema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Masukkan nama pengguna atau no. IC.").max(60),
  password: z.string().min(1, "Masukkan kata laluan.").max(200),
});

const WINDOW_MIN = 15;

/** No. IC boleh ditaip dengan atau tanpa sengkang (cth. 060101-02-1234) */
export function normalizeIc(v: string) {
  return v.replace(/[\s-]/g, "");
}
export const IC_RE = /^\d{12}$/;

/**
 * Log masuk berasingan mengikut portal:
 *  - "admin": hanya role akses penuh (Admin / Ketua Warden)
 *  - "umum":  pelajar & staf asrama lain; akaun admin ditolak dan diarahkan ke portal admin
 */
export async function performLogin(fd: FormData, portal: Portal): Promise<LoginResult> {
  const parsed = schema.safeParse({ username: fd.get("username"), password: fd.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { password } = parsed.data;
  const raw = parsed.data.username;
  const username = IC_RE.test(normalizeIc(raw)) ? normalizeIc(raw) : raw;
  const ip = await clientIp();

  // Rate limiting: 5 cubaan gagal bagi setiap nama pengguna, 20 bagi setiap IP, dalam 15 minit
  const since = new Date(Date.now() - WINDOW_MIN * 60_000);
  const [byUser, byIp] = await Promise.all([
    db.loginAttempt.count({ where: { username, success: false, createdAt: { gte: since } } }),
    db.loginAttempt.count({ where: { ip, success: false, createdAt: { gte: since } } }),
  ]);
  if (byUser >= 5 || byIp >= 20) {
    return { error: `Terlalu banyak cubaan log masuk yang gagal. Cuba lagi selepas ${WINDOW_MIN} minit.` };
  }

  const user = await db.user.findUnique({ where: { username }, include: { role: { select: { key: true } } } });
  const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash());
  if (!user || !user.passwordHash || !valid) {
    await db.loginAttempt.create({ data: { username, ip, success: false } });
    await audit(user?.id ?? null, "LOGIN_GAGAL", `Cubaan log masuk gagal untuk "${username}" (portal ${portal})`);
    return { error: portal === "admin" ? "Nama pengguna atau kata laluan admin tidak sah." : "Nama pengguna / no. IC atau kata laluan tidak sah." };
  }

  const isAdmin = FULL_ACCESS_ROLES.includes(user.role.key as RoleKeyT);
  if (portal === "admin" && !isAdmin) {
    await db.loginAttempt.create({ data: { username, ip, success: false } });
    return { error: "Portal ini khas untuk pentadbir sahaja. Sila guna halaman log masuk pelajar & staf." };
  }
  if (portal === "umum" && isAdmin) {
    return { error: "Akaun pentadbir perlu log masuk melalui Portal Admin." };
  }

  if (user.status !== "ACTIVE") {
    return {
      error:
        user.status === "INACTIVE"
          ? "Akaun ini telah dinyahaktifkan. Hubungi Warden."
          : "Akaun ini belum diaktifkan. Gunakan pautan pengaktifan yang diberikan oleh Warden.",
    };
  }

  await db.loginAttempt.create({ data: { username, ip, success: true } });
  await createSession(user.id);
  await db.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
  await audit(user.id, "LOGIN", `${user.name} log masuk (portal ${portal})`);
  return { ok: true };
}
