"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { findValidToken, passwordSchema } from "@/lib/account";
import { audit } from "@/lib/audit";
import type { ActionState } from "@/lib/action";

export async function setPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const token = String(fd.get("token") ?? "");
  const password = String(fd.get("password") ?? "");
  if (password !== String(fd.get("confirm") ?? "")) return { error: "Kedua-dua kata laluan tidak sama." };
  const parsed = passwordSchema.safeParse(password);
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const t = await findValidToken(token);
  if (!t) return { error: "Pautan ini tidak lagi sah. Minta Warden menjana pautan baharu." };
  if (t.user.status === "INACTIVE") return { error: "Akaun ini telah dinyahaktifkan. Hubungi Warden." };

  await db.$transaction([
    db.user.update({ where: { id: t.userId }, data: { passwordHash: await hashPassword(password), status: "ACTIVE" } }),
    db.accountToken.update({ where: { id: t.id }, data: { usedAt: new Date() } }),
    // Tamatkan semua sesi lama selepas kata laluan berubah
    db.session.updateMany({ where: { userId: t.userId, revokedAt: null }, data: { revokedAt: new Date() } }),
  ]);
  await audit(t.userId, t.type === "ACTIVATION" ? "AKAUN_AKTIF" : "KATA_LALUAN_RESET", `${t.user.name} ${t.type === "ACTIVATION" ? "mengaktifkan akaun" : "menetapkan semula kata laluan"}`, { entityType: "User", entityId: t.userId });
  redirect(`/login?ok=${encodeURIComponent("Kata laluan disimpan. Sila log masuk.")}`);
}
