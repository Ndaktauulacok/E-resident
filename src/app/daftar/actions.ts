"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { clientIp, createSession, hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { IC_RE, normalizeIc } from "@/lib/login";
import type { ActionState } from "@/lib/action";

const schema = z.object({
  name: z.string().trim().min(3, "Masukkan nama penuh.").max(120, "Nama terlalu panjang."),
  ic: z
    .string()
    .transform(normalizeIc)
    .refine((v) => IC_RE.test(v), "No. IC mesti 12 digit (cth. 060101021234)."),
  phone: z
    .string()
    .trim()
    .max(20)
    .refine((v) => v === "" || /^[0-9+\-\s]{9,20}$/.test(v), "No. telefon tidak sah.")
    .optional(),
  agree: z.literal("on", { errorMap: () => ({ message: "Sila sahkan maklumat anda adalah benar." }) }),
});

/** Bulan & hari dalam IC mesti munasabah (YYMMDD) */
function plausibleIc(ic: string) {
  const mm = Number(ic.slice(2, 4));
  const dd = Number(ic.slice(4, 6));
  return mm >= 1 && mm <= 12 && dd >= 1 && dd <= 31;
}

export async function signupAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const parsed = schema.safeParse({
    name: fd.get("name"),
    ic: String(fd.get("ic") ?? ""),
    phone: String(fd.get("phone") ?? ""),
    agree: fd.get("agree"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const { name, ic, phone } = parsed.data;
  if (!plausibleIc(ic)) return { error: "No. IC tidak sah. Semak semula 6 digit pertama (tarikh lahir)." };

  // Had pendaftaran: 10 akaun bagi setiap IP dalam sejam
  const ip = await clientIp();
  const since = new Date(Date.now() - 3600_000);
  const recent = await db.loginAttempt.count({ where: { username: "__daftar__", ip, createdAt: { gte: since } } });
  if (recent >= 10) return { error: "Terlalu banyak pendaftaran dari rangkaian ini. Cuba lagi selepas sejam." };

  if (await db.user.findUnique({ where: { username: ic } })) {
    return { error: "No. IC ini sudah didaftarkan. Sila log masuk menggunakan no. IC dan 4 digit terakhir IC." };
  }

  const role = await db.role.findUnique({ where: { key: "PENGHUNI" } });
  if (!role) return { error: "Sistem belum disediakan sepenuhnya. Hubungi pentadbir." };

  // Kata laluan = 4 digit terakhir no. IC (seperti yang ditetapkan pihak kolej)
  const user = await db.user.create({
    data: {
      username: ic,
      name,
      phone: phone || null,
      passwordHash: await hashPassword(ic.slice(-4)),
      status: "ACTIVE",
      roleId: role.id,
    },
  });
  await db.loginAttempt.create({ data: { username: "__daftar__", ip, success: true } });
  await audit(user.id, "DAFTAR_PELAJAR", `${name} mendaftar akaun pelajar sendiri`, { entityType: "User", entityId: user.id });

  await createSession(user.id);
  redirect("/dashboard?ok=" + encodeURIComponent("Pendaftaran berjaya. Selamat datang ke E-RESIDENT!"));
}
