"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, createSession, dummyHash, verifyPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import type { ActionState } from "@/lib/action";

const schema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Masukkan nama pengguna.").max(60),
  password: z.string().min(1, "Masukkan kata laluan.").max(200),
});

const WINDOW_MIN = 15;

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({ username: fd.get("username"), password: fd.get("password") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { username, password } = parsed.data;
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

  const user = await db.user.findUnique({ where: { username } });
  const valid = await verifyPassword(password, user?.passwordHash ?? dummyHash());
  if (!user || !user.passwordHash || !valid) {
    await db.loginAttempt.create({ data: { username, ip, success: false } });
    await audit(user?.id ?? null, "LOGIN_GAGAL", `Cubaan log masuk gagal untuk "${username}"`);
    return { error: "Nama pengguna atau kata laluan tidak sah." };
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
  await audit(user.id, "LOGIN", `${user.name} log masuk`);
  redirect("/dashboard");
}
