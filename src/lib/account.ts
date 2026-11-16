import "server-only";
import { z } from "zod";
import { db } from "./db";
import { hashToken, newToken } from "./tokens";

export const passwordSchema = z
  .string()
  .min(10, "Kata laluan mesti sekurang-kurangnya 10 aksara.")
  .max(128, "Kata laluan terlalu panjang.")
  .regex(/[A-Za-z]/, "Kata laluan mesti mengandungi huruf.")
  .regex(/[0-9]/, "Kata laluan mesti mengandungi nombor.");

const TTL = { ACTIVATION: 72, PASSWORD_RESET: 2 } as const; // jam

/** Jana pautan sekali guna. Token mentah hanya dipaparkan sekali; pangkalan data simpan hash sahaja. */
export async function issueAccountLink(userId: string, type: "ACTIVATION" | "PASSWORD_RESET") {
  // Batalkan token lama yang belum digunakan
  await db.accountToken.updateMany({ where: { userId, type, usedAt: null }, data: { usedAt: new Date() } });
  const token = newToken();
  await db.accountToken.create({
    data: { userId, type, tokenHash: hashToken(token), expiresAt: new Date(Date.now() + TTL[type] * 3600_000) },
  });
  const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
  return { link: `${base}/kata-laluan/${token}`, hours: TTL[type] };
}

export async function findValidToken(token: string) {
  if (!/^[A-Za-z0-9_-]{20,100}$/.test(token)) return null;
  const t = await db.accountToken.findUnique({ where: { tokenHash: hashToken(token) }, include: { user: true } });
  if (!t || t.usedAt || t.expiresAt < new Date()) return null;
  return t;
}
