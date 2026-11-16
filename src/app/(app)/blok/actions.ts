"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma, type RoleKey } from "@prisma/client";
import { db } from "@/lib/db";
import { guarded, str, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";

const blockSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{1,10}$/, "Kod blok: huruf/nombor sahaja, maksimum 10 aksara."),
  name: z.string().trim().min(2, "Nama blok terlalu pendek.").max(80),
  gender: z.enum(["LELAKI", "PEREMPUAN"], { message: "Pilih jenis asrama." }),
  description: z.string().trim().max(255),
});

const dup = (msg: string) => (e: unknown): never => {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new UserError(msg);
  throw e;
};

export const saveBlockAction = guarded("blocks.manage", async (user, fd) => {
  const id = str(fd, "id");
  const data = blockSchema.parse({ code: str(fd, "code"), name: str(fd, "name"), gender: str(fd, "gender"), description: str(fd, "description") });
  if (id) {
    const before = await db.block.findUniqueOrThrow({ where: { id } });
    if (before.gender !== data.gender && (await db.resident.count({ where: { dorm: { blockId: id }, status: { in: ["AKTIF", "MENUNGGU_PENDAFTARAN"] } } })))
      throw new UserError("Jenis asrama tidak boleh ditukar semasa blok masih mempunyai penghuni.");
    await db.block.update({ where: { id }, data: { ...data, isActive: fd.get("isActive") === "on" } }).catch(dup("Kod blok sudah digunakan."));
    await audit(user.id, "BLOK_KEMASKINI", `Mengemas kini Blok ${data.code} ${data.name}`, { entityType: "Block", entityId: id });
  } else {
    const b = await db.block.create({ data }).catch(dup("Kod blok sudah digunakan."));
    await audit(user.id, "BLOK_TAMBAH", `Menambah Blok ${data.code} ${data.name}`, { entityType: "Block", entityId: b.id });
  }
  revalidatePath("/blok", "layout");
  return { ok: true, message: id ? "Blok dikemas kini." : "Blok ditambah." };
});

const dormSchema = z.object({
  code: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{1,10}$/, "Kod dorm: huruf, nombor dan sengkang, maksimum 10 aksara."),
  floor: z.coerce.number().int().min(0, "Aras tidak sah.").max(30),
  capacity: z.coerce.number().int().min(1, "Kapasiti sekurang-kurangnya 1.").max(60, "Kapasiti maksimum 60."),
});

export const saveDormAction = guarded("blocks.manage", async (user, fd) => {
  const id = str(fd, "id");
  const data = dormSchema.parse({ code: str(fd, "code"), floor: str(fd, "floor"), capacity: str(fd, "capacity") });
  if (id) {
    const occupied = await db.resident.count({ where: { dormId: id, status: { in: ["AKTIF", "MENUNGGU_PENDAFTARAN"] } } });
    if (data.capacity < occupied) throw new UserError(`Kapasiti tidak boleh kurang daripada bilangan penghuni semasa (${occupied}).`);
    const isActive = fd.get("isActive") === "on";
    if (!isActive && occupied) throw new UserError("Pindahkan semua penghuni sebelum menyahaktifkan dorm ini.");
    await db.dorm.update({ where: { id }, data: { ...data, isActive } }).catch(dup("Kod dorm sudah wujud dalam blok ini."));
    await audit(user.id, "DORM_KEMASKINI", `Mengemas kini dorm ${data.code} (kapasiti ${data.capacity})`, { entityType: "Dorm", entityId: id });
  } else {
    const blockId = str(fd, "blockId");
    if (!(await db.block.findUnique({ where: { id: blockId } }))) throw new UserError("Blok tidak sah.");
    const d = await db.dorm.create({ data: { ...data, blockId } }).catch(dup("Kod dorm sudah wujud dalam blok ini."));
    await audit(user.id, "DORM_TAMBAH", `Menambah dorm ${data.code}`, { entityType: "Dorm", entityId: d.id });
  }
  revalidatePath("/blok", "layout");
  revalidatePath("/dorm", "layout");
  return { ok: true, message: id ? "Dorm dikemas kini." : "Dorm ditambah." };
});

async function checkRole(userId: string, roles: RoleKey[]) {
  if (!userId) return null;
  const u = await db.user.findUnique({ where: { id: userId }, include: { role: true } });
  if (!u || u.status !== "ACTIVE" || !roles.includes(u.role.key)) throw new UserError("Pengguna yang dipilih tidak mempunyai role yang sesuai atau tidak aktif.");
  return u.id;
}

/** Tetapkan Ketua/Penolong bagi blok atau dorm. Seorang pengguna hanya mengetuai satu unit. */
export const assignLeadersAction = guarded("blocks.manage", async (user, fd) => {
  const kind = str(fd, "kind");
  const id = str(fd, "id");
  const head = str(fd, "headUserId");
  const asst = str(fd, "assistantUserId");
  if (head && head === asst) throw new UserError("Ketua dan penolong mestilah orang yang berbeza.");
  if (kind === "block") {
    const headId = await checkRole(head, ["KETUA_BLOK"]);
    const asstId = await checkRole(asst, ["PEN_KETUA_BLOK"]);
    await db.$transaction([
      ...(headId ? [db.block.updateMany({ where: { headUserId: headId, id: { not: id } }, data: { headUserId: null } })] : []),
      ...(asstId ? [db.block.updateMany({ where: { assistantUserId: asstId, id: { not: id } }, data: { assistantUserId: null } })] : []),
      db.block.update({ where: { id }, data: { headUserId: headId, assistantUserId: asstId } }),
    ]);
  } else if (kind === "dorm") {
    const headId = await checkRole(head, ["KETUA_DORM"]);
    const asstId = await checkRole(asst, ["PEN_KETUA_DORM"]);
    await db.$transaction([
      ...(headId ? [db.dorm.updateMany({ where: { headUserId: headId, id: { not: id } }, data: { headUserId: null } })] : []),
      ...(asstId ? [db.dorm.updateMany({ where: { assistantUserId: asstId, id: { not: id } }, data: { assistantUserId: null } })] : []),
      db.dorm.update({ where: { id }, data: { headUserId: headId, assistantUserId: asstId } }),
    ]);
  } else throw new UserError("Jenis tidak sah.");
  await audit(user.id, "KETUA_TETAP", `Menetapkan ketua & penolong bagi ${kind === "block" ? "blok" : "dorm"}`, { entityType: kind === "block" ? "Block" : "Dorm", entityId: id, meta: { head, asst } });
  revalidatePath("/", "layout");
  return { ok: true, message: "Kepimpinan dikemas kini." };
});

export const setBlockWardensAction = guarded("blocks.manage", async (user, fd) => {
  const blockId = str(fd, "blockId");
  const ids = fd.getAll("wardens").map(String);
  const valid = await db.user.findMany({ where: { id: { in: ids }, status: "ACTIVE", role: { key: "WARDEN" } }, select: { id: true, name: true } });
  await db.$transaction([
    db.wardenAssignment.deleteMany({ where: { blockId } }),
    db.wardenAssignment.createMany({ data: valid.map((v) => ({ blockId, wardenUserId: v.id })) }),
  ]);
  await audit(user.id, "WARDEN_BIDANG_KUASA", `Menetapkan Warden blok: ${valid.map((v) => v.name).join(", ") || "tiada"}`, { entityType: "Block", entityId: blockId });
  revalidatePath("/", "layout");
  return { ok: true, message: "Warden bertanggungjawab dikemas kini." };
});
