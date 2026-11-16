"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { guarded, str, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { issueAccountLink } from "@/lib/account";
import { GRANTABLE, ROLE_KEYS, type RoleKeyT } from "@/lib/permissions";

const schema = z.object({
  name: z.string().trim().min(3, "Nama terlalu pendek.").max(120),
  username: z.string().trim().toLowerCase().regex(/^[a-z0-9._-]{3,60}$/, "Nama pengguna: 3 hingga 60 aksara (huruf kecil, nombor, titik, sengkang)."),
  email: z.string().trim().toLowerCase().email("E-mel tidak sah.").or(z.literal("")),
  phone: z.string().trim().regex(/^(\+?6?0)[0-9-]{8,12}$/, "No. telefon tidak sah.").or(z.literal("")),
  role: z.enum(ROLE_KEYS, { message: "Pilih role." }),
});

const dup = (e: unknown): never => {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new UserError("Nama pengguna atau e-mel sudah digunakan oleh akaun lain.");
  throw e;
};

export const createUserAction = guarded("users.manage", async (user, fd) => {
  const v = schema.parse({ name: str(fd, "name"), username: str(fd, "username"), email: str(fd, "email"), phone: str(fd, "phone"), role: str(fd, "role") });
  const role = await db.role.findUniqueOrThrow({ where: { key: v.role } });
  const u = await db.user.create({ data: { name: v.name, username: v.username, email: v.email || null, phone: v.phone || null, roleId: role.id, status: "PENDING_ACTIVATION" } }).catch(dup);
  const { link, hours } = await issueAccountLink(u.id, "ACTIVATION");
  await audit(user.id, "AKAUN_CIPTA", `Mencipta akaun ${u.username} (${role.name})`, { entityType: "User", entityId: u.id });
  revalidatePath("/akaun");
  return { ok: true, message: `Akaun ${u.username} dicipta. Berikan pautan pengaktifan ini kepada pemilik akaun (sah ${hours} jam, sekali guna):`, link };
});

async function target(actorId: string, id: string) {
  const u = await db.user.findUnique({ where: { id }, include: { role: true } });
  if (!u) throw new UserError("Akaun tidak dijumpai.");
  return { u, self: u.id === actorId };
}

export const updateUserAction = guarded("users.manage", async (user, fd) => {
  const { u, self } = await target(user.id, str(fd, "id"));
  const v = schema.parse({ name: str(fd, "name"), username: str(fd, "username"), email: str(fd, "email"), phone: str(fd, "phone"), role: str(fd, "role") });
  if (self && v.role !== u.role.key) throw new UserError("Anda tidak boleh menukar role akaun sendiri.");
  const role = await db.role.findUniqueOrThrow({ where: { key: v.role } });
  await db.user.update({ where: { id: u.id }, data: { name: v.name, username: v.username, email: v.email || null, phone: v.phone || null, roleId: role.id } }).catch(dup);
  if (v.role !== u.role.key) {
    // Role berubah: buang kebenaran tambahan lama & tamatkan sesi supaya kebenaran baharu berkuat kuasa
    await db.userPermission.deleteMany({ where: { userId: u.id } });
    await db.session.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
    await audit(user.id, "ROLE_TUKAR", `Menukar role ${u.username} daripada ${u.role.name} kepada ${role.name}`, { entityType: "User", entityId: u.id, meta: { from: u.role.key, to: v.role } });
  } else {
    await audit(user.id, "AKAUN_KEMASKINI", `Mengemas kini akaun ${v.username}`, { entityType: "User", entityId: u.id });
  }
  revalidatePath(`/akaun/${u.id}`);
  return { ok: true, message: "Akaun dikemas kini." };
});

export const setUserStatusAction = guarded("users.manage", async (user, fd) => {
  const { u, self } = await target(user.id, str(fd, "id"));
  if (self) throw new UserError("Anda tidak boleh menukar status akaun sendiri.");
  const activate = str(fd, "to") === "ACTIVE";
  if (activate && !u.passwordHash) throw new UserError("Akaun ini belum mempunyai kata laluan. Jana pautan pengaktifan sebaliknya.");
  await db.user.update({ where: { id: u.id }, data: { status: activate ? "ACTIVE" : "INACTIVE" } });
  if (!activate) await db.session.updateMany({ where: { userId: u.id, revokedAt: null }, data: { revokedAt: new Date() } });
  await audit(user.id, activate ? "AKAUN_AKTIF" : "AKAUN_NYAHAKTIF", `${activate ? "Mengaktifkan" : "Menyahaktifkan"} akaun ${u.username}`, { entityType: "User", entityId: u.id });
  revalidatePath(`/akaun/${u.id}`);
  return { ok: true, message: activate ? "Akaun diaktifkan." : "Akaun dinyahaktifkan dan semua sesinya ditamatkan." };
});

export const issueLinkAction = guarded("users.manage", async (user, fd) => {
  const { u } = await target(user.id, str(fd, "id"));
  if (u.status === "INACTIVE") throw new UserError("Aktifkan akaun terlebih dahulu.");
  const type = u.status === "PENDING_ACTIVATION" ? "ACTIVATION" : "PASSWORD_RESET";
  const { link, hours } = await issueAccountLink(u.id, type);
  await audit(user.id, type === "ACTIVATION" ? "PAUTAN_AKTIF" : "PAUTAN_RESET", `Menjana pautan ${type === "ACTIVATION" ? "pengaktifan" : "tetapan semula kata laluan"} untuk ${u.username}`, { entityType: "User", entityId: u.id });
  return { ok: true, message: `Pautan dijana (sah ${hours} jam, sekali guna). Pautan lama tidak lagi sah. Serahkan secara peribadi kepada pemilik akaun:`, link };
});

export const setOverridesAction = guarded("users.manage", async (user, fd) => {
  const { u } = await target(user.id, str(fd, "id"));
  const allowed = GRANTABLE[u.role.key as RoleKeyT] ?? [];
  if (!allowed.length) throw new UserError("Role ini tidak menggunakan kebenaran tambahan.");
  const chosen = fd.getAll("perm").map(String).filter((p) => (allowed as string[]).includes(p));
  const perms = await db.permission.findMany({ where: { key: { in: allowed as string[] } } });
  await db.$transaction([
    db.userPermission.deleteMany({ where: { userId: u.id, permissionId: { in: perms.map((p) => p.id) } } }),
    db.userPermission.createMany({ data: perms.filter((p) => chosen.includes(p.key)).map((p) => ({ userId: u.id, permissionId: p.id, grantedById: user.id })) }),
  ]);
  await audit(user.id, "KEBENARAN_TAMBAHAN", `Kebenaran tambahan ${u.username}: ${chosen.join(", ") || "tiada"}`, { entityType: "User", entityId: u.id, meta: { chosen } });
  revalidatePath(`/akaun/${u.id}`);
  return { ok: true, message: "Kebenaran tambahan dikemas kini." };
});

export const revokeSessionAction = guarded(null, async (user, fd) => {
  const s = await db.session.findUnique({ where: { id: str(fd, "sessionId") } });
  if (!s) throw new UserError("Sesi tidak dijumpai.");
  // Pengguna boleh menamatkan sesi sendiri; pengurus akaun boleh menamatkan sesi sesiapa
  if (s.userId !== user.id && !user.perms.has("users.manage")) throw new UserError("Anda tidak mempunyai kebenaran untuk tindakan ini.");
  await db.session.update({ where: { id: s.id }, data: { revokedAt: new Date() } });
  await audit(user.id, "SESI_TAMAT", "Menamatkan satu sesi log masuk", { entityType: "User", entityId: s.userId });
  if (s.id === user.sessionId) redirect("/login");
  revalidatePath("/", "layout");
  return { ok: true, message: "Sesi ditamatkan." };
});
