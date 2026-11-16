"use server";

import { db } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { guarded, str, UserError } from "@/lib/action";
import { IC_RE } from "@/lib/login";

/** Pastikan sasaran ialah akaun pelajar daftar sendiri (username = no. IC, role Penghuni) */
async function studentOf(id: string) {
  const u = await db.user.findUnique({ where: { id }, include: { role: { select: { key: true } } } });
  if (!u || u.role.key !== "PENGHUNI" || !IC_RE.test(u.username)) throw new UserError("Akaun pelajar tidak dijumpai.");
  return u;
}

export const toggleStudentAction = guarded("users.manage", async (admin, fd) => {
  const u = await studentOf(str(fd, "id"));
  const next = u.status === "ACTIVE" ? "INACTIVE" : "ACTIVE";
  await db.user.update({ where: { id: u.id }, data: { status: next } });
  if (next === "INACTIVE") await db.session.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit(admin.id, next === "ACTIVE" ? "AKAUN_AKTIF" : "AKAUN_NYAHAKTIF", `${admin.name} ${next === "ACTIVE" ? "mengaktifkan" : "menyahaktifkan"} akaun pelajar ${u.name}`, { entityType: "User", entityId: u.id });
  return { ok: true, message: next === "ACTIVE" ? "Akaun diaktifkan." : "Akaun dinyahaktifkan." };
});

export const resetStudentPasswordAction = guarded("users.manage", async (admin, fd) => {
  const u = await studentOf(str(fd, "id"));
  await db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(u.username.slice(-4)) } });
  await db.session.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit(admin.id, "RESET_KATA_LALUAN", `${admin.name} menetapkan semula kata laluan ${u.name} kepada 4 digit terakhir IC`, { entityType: "User", entityId: u.id });
  return { ok: true, message: "Kata laluan ditetapkan semula kepada 4 digit terakhir IC." };
});

export const deleteStudentAction = guarded("users.manage", async (admin, fd) => {
  const u = await studentOf(str(fd, "id"));
  try {
    await db.user.delete({ where: { id: u.id } });
  } catch {
    throw new UserError("Akaun ini sudah mempunyai rekod berkaitan dan tidak boleh dipadam. Nyahaktifkan akaun sahaja.");
  }
  await audit(admin.id, "AKAUN_PADAM", `${admin.name} memadam akaun pelajar ${u.name}`, { entityType: "User", entityId: u.id });
  return { ok: true, message: "Akaun dipadam." };
});
