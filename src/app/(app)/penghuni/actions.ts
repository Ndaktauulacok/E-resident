"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { can, getScope, inScope, isFullAccess, type AuthUser } from "@/lib/auth";
import { guarded, str, UserError } from "@/lib/action";
import { audit, blockLeaders, blockWardens, dormLeaders, notify } from "@/lib/audit";
import { issueAccountLink } from "@/lib/account";

const residentSchema = z.object({
  fullName: z.string().trim().min(3, "Nama penuh terlalu pendek.").max(150),
  matricNo: z.string().trim().toUpperCase().regex(/^[A-Z0-9-]{4,30}$/, "No. matrik hanya boleh mengandungi huruf, nombor dan sengkang (4 hingga 30 aksara)."),
  gender: z.enum(["LELAKI", "PEREMPUAN"], { message: "Pilih jantina." }),
  phone: z.string().trim().regex(/^(\+?6?0)[0-9-]{8,12}$/, "No. telefon tidak sah. Contoh: 012-3456789").or(z.literal("")),
});

function readResident(fd: FormData) {
  return residentSchema.parse({ fullName: str(fd, "fullName"), matricNo: str(fd, "matricNo"), gender: str(fd, "gender"), phone: str(fd, "phone") });
}

async function checkDorm(dormId: string, gender: string, excludeResidentId?: string) {
  const dorm = await db.dorm.findUnique({ where: { id: dormId }, include: { block: true } });
  if (!dorm || !dorm.isActive) throw new UserError("Dorm tidak sah.");
  if (dorm.block.gender !== gender) throw new UserError(`Blok ${dorm.block.name} ialah asrama ${dorm.block.gender.toLowerCase()}.`);
  const used = await db.resident.count({ where: { dormId, status: { in: ["AKTIF", "MENUNGGU_PENDAFTARAN"] }, ...(excludeResidentId ? { id: { not: excludeResidentId } } : {}) } });
  if (used >= dorm.capacity) throw new UserError(`Dorm ${dorm.code} sudah penuh (kapasiti ${dorm.capacity}).`);
  return dorm;
}

function uniqueGuard(e: unknown): never {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") throw new UserError("No. matrik ini sudah didaftarkan.");
  throw e;
}

/** Staf (Admin/Ketua Warden/Warden) menambah terus; kepimpinan dorm melalui aliran pendaftaran */
const directAdd = (u: AuthUser) => isFullAccess(u) || u.role === "WARDEN";

export const createResidentAction = guarded(["residents.register", "residents.manage"], async (user, fd) => {
  const data = readResident(fd);
  const dormId = str(fd, "dormId");
  if (!dormId) throw new UserError("Pilih dorm.");
  const scope = await getScope(user);
  if (!inScope(scope, dormId)) throw new UserError("Anda hanya boleh mendaftar penghuni bagi dorm dalam bidang kuasa anda.");
  const direct = directAdd(user) && can(user, "residents.manage");
  if (!direct && !can(user, "residents.register")) throw new UserError("Anda tidak mempunyai kebenaran untuk mendaftar penghuni.");
  const dorm = await checkDorm(dormId, data.gender);
  const requestAccount = fd.get("requestAccount") === "on";

  if (direct) {
    const r = await db.resident.create({ data: { ...data, phone: data.phone || null, dormId, status: "AKTIF" } }).catch(uniqueGuard);
    await db.residentHistory.create({ data: { residentId: r.id, action: "DAFTAR", toDormId: dormId, byUserId: user.id, note: "Didaftarkan terus oleh staf" } });
    await audit(user.id, "PENGHUNI_TAMBAH", `Menambah penghuni ${r.fullName} (${r.matricNo}) ke ${dorm.code}`, { entityType: "Resident", entityId: r.id });
    let link: string | undefined;
    if (requestAccount) link = (await createResidentAccount(user, r.id)).link;
    revalidatePath("/penghuni");
    if (link) return { ok: true, message: `Penghuni ${r.fullName} ditambah. Berikan pautan pengaktifan ini kepada penghuni (sah 72 jam, sekali guna):`, link };
    redirect(`/penghuni/${r.id}?ok=${encodeURIComponent("Penghuni ditambah.")}`);
  }

  const reg = await db.$transaction(async (tx) => {
    const r = await tx.resident.create({ data: { ...data, phone: data.phone || null, dormId, status: "MENUNGGU_PENDAFTARAN" } });
    const g = await tx.residentRegistration.create({ data: { residentId: r.id, requestAccount, submittedById: user.id } });
    await tx.residentHistory.create({ data: { residentId: r.id, action: "DAFTAR", toDormId: dormId, byUserId: user.id, note: requestAccount ? "Permohonan pendaftaran & akaun login" : "Permohonan pendaftaran" } });
    await tx.approval.create({ data: { entityType: "RESIDENT_REGISTRATION", entityId: g.id, stage: "DORM", action: "HANTAR", actorId: user.id } });
    return g;
  }).catch(uniqueGuard);
  await audit(user.id, "PENDAFTARAN_HANTAR", `Menghantar pendaftaran ${data.fullName} (${data.matricNo}) bagi ${dorm.code}`, { entityType: "ResidentRegistration", entityId: reg.id });
  await notify(await blockLeaders(dorm.blockId), `Pendaftaran baharu menunggu semakan: ${data.fullName}`, `Dorm ${dorm.code}`, `/pendaftaran/${reg.id}`);
  revalidatePath("/", "layout");
  redirect(`/pendaftaran/${reg.id}?ok=${encodeURIComponent("Pendaftaran dihantar kepada Ketua Blok.")}`);
});

async function createResidentAccount(user: AuthUser, residentId: string) {
  const r = await db.resident.findUniqueOrThrow({ where: { id: residentId } });
  if (r.userId) throw new UserError("Penghuni ini sudah mempunyai akaun.");
  const role = await db.role.findUniqueOrThrow({ where: { key: "PENGHUNI" } });
  const username = r.matricNo.toLowerCase();
  if (await db.user.findUnique({ where: { username } })) throw new UserError(`Nama pengguna ${username} sudah wujud.`);
  const u = await db.user.create({ data: { username, name: r.fullName, phone: r.phone, roleId: role.id, status: "PENDING_ACTIVATION" } });
  await db.resident.update({ where: { id: r.id }, data: { userId: u.id } });
  await audit(user.id, "AKAUN_CIPTA", `Mencipta akaun penghuni ${username}`, { entityType: "User", entityId: u.id });
  return issueAccountLink(u.id, "ACTIVATION");
}

export const reviewRegistrationAction = guarded(["registration.review.block", "registration.review.warden"], async (user, fd) => {
  const id = str(fd, "id");
  const decision = str(fd, "decision") as "LULUS" | "KEMBALIKAN" | "TOLAK";
  const note = str(fd, "note").slice(0, 500);
  if (!["LULUS", "KEMBALIKAN", "TOLAK"].includes(decision)) throw new UserError("Keputusan tidak sah.");
  if (decision !== "LULUS" && note.length < 5) throw new UserError("Nyatakan sebab keputusan ini.");
  const g = await db.residentRegistration.findUnique({ where: { id }, include: { resident: { include: { dorm: true } } } });
  if (!g) throw new UserError("Permohonan tidak dijumpai.");
  const scope = await getScope(user);
  if (!inScope(scope, g.resident.dormId)) throw new UserError("Permohonan ini di luar bidang kuasa anda.");
  if (g.submittedById === user.id && !isFullAccess(user)) throw new UserError("Anda tidak boleh menyemak permohonan yang anda hantar sendiri.");

  let stage: "KETUA_BLOK" | "WARDEN";
  if (g.status === "MENUNGGU_KETUA_BLOK" && can(user, "registration.review.block")) stage = "KETUA_BLOK";
  else if (g.status === "MENUNGGU_WARDEN" && can(user, "registration.review.warden")) stage = "WARDEN";
  else throw new UserError("Permohonan ini tidak menunggu semakan anda.");

  const next =
    decision === "TOLAK" ? "DITOLAK" : decision === "KEMBALIKAN" ? "PERLU_PEMBETULAN" : stage === "KETUA_BLOK" ? "MENUNGGU_WARDEN" : "DILULUSKAN";

  const changed = await db.$transaction(async (tx) => {
    const u = await tx.residentRegistration.updateMany({ where: { id, status: g.status }, data: { status: next } });
    if (!u.count) return 0;
    await tx.approval.create({ data: { entityType: "RESIDENT_REGISTRATION", entityId: id, stage, action: decision, actorId: user.id, note: note || null } });
    if (next === "DILULUSKAN") await tx.resident.update({ where: { id: g.residentId }, data: { status: "AKTIF", registeredAt: new Date() } });
    if (next === "DITOLAK") await tx.resident.update({ where: { id: g.residentId }, data: { status: "DITOLAK" } });
    return 1;
  });
  if (!changed) throw new UserError("Permohonan ini telah dikemas kini oleh pengguna lain. Muat semula halaman.");

  await audit(user.id, `PENDAFTARAN_${decision}`, `${decision === "LULUS" ? "Meluluskan" : decision === "TOLAK" ? "Menolak" : "Mengembalikan"} pendaftaran ${g.resident.fullName} (peringkat ${stage === "WARDEN" ? "Warden" : "Ketua Blok"})`, { entityType: "ResidentRegistration", entityId: id });
  const leaders = [g.submittedById, ...(await dormLeaders(g.resident.dormId))];
  if (next === "MENUNGGU_WARDEN") await notify(await blockWardens(g.resident.dorm.blockId), `Pendaftaran ${g.resident.fullName} menunggu pengesahan`, undefined, `/pendaftaran/${id}`);
  if (next === "PERLU_PEMBETULAN") await notify(leaders, `Pendaftaran ${g.resident.fullName} perlu dibetulkan`, note, `/pendaftaran/${id}`);
  if (next === "DITOLAK") await notify(leaders, `Pendaftaran ${g.resident.fullName} ditolak`, note, `/pendaftaran/${id}`);
  if (next === "DILULUSKAN") {
    await notify(leaders, `Pendaftaran ${g.resident.fullName} diluluskan`, undefined, `/pendaftaran/${id}`);
    await db.residentHistory.create({ data: { residentId: g.residentId, action: "AKTIF", toDormId: g.resident.dormId, byUserId: user.id, note: "Pendaftaran diluluskan Warden" } });
    if (g.requestAccount) {
      const { link } = await createResidentAccount(user, g.residentId);
      // Tiada revalidate di sini: dialog perlu kekal untuk memaparkan pautan sekali; halaman dimuat semula selepas dialog ditutup
      return { ok: true, message: `Diluluskan. Akaun ${g.resident.matricNo.toLowerCase()} dicipta. Berikan pautan pengaktifan ini kepada penghuni (sah 72 jam, sekali guna):`, link };
    }
  }
  revalidatePath("/", "layout");
  return { ok: true, message: decision === "LULUS" ? "Permohonan diluluskan." : decision === "TOLAK" ? "Permohonan ditolak." : "Permohonan dikembalikan untuk pembetulan." };
});

export const resubmitRegistrationAction = guarded("residents.register", async (user, fd) => {
  const id = str(fd, "id");
  const g = await db.residentRegistration.findUnique({ where: { id }, include: { resident: true } });
  if (!g || g.status !== "PERLU_PEMBETULAN") throw new UserError("Permohonan ini tidak memerlukan pembetulan.");
  const scope = await getScope(user);
  if (!inScope(scope, g.resident.dormId)) throw new UserError("Permohonan ini di luar bidang kuasa anda.");
  const data = readResident(fd);
  await checkDorm(g.resident.dormId, data.gender, g.residentId);
  await db.$transaction(async (tx) => {
    await tx.resident.update({ where: { id: g.residentId }, data: { ...data, phone: data.phone || null } });
    await tx.residentRegistration.update({ where: { id }, data: { status: "MENUNGGU_KETUA_BLOK", requestAccount: fd.get("requestAccount") === "on" } });
    await tx.approval.create({ data: { entityType: "RESIDENT_REGISTRATION", entityId: id, stage: "DORM", action: "PINDA", actorId: user.id, note: "Dibetulkan dan dihantar semula" } });
  }).catch(uniqueGuard);
  const dorm = await db.dorm.findUniqueOrThrow({ where: { id: g.resident.dormId } });
  await audit(user.id, "PENDAFTARAN_PINDA", `Membetulkan & menghantar semula pendaftaran ${data.fullName}`, { entityType: "ResidentRegistration", entityId: id });
  await notify(await blockLeaders(dorm.blockId), `Pendaftaran ${data.fullName} dihantar semula`, undefined, `/pendaftaran/${id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: "Pembetulan disimpan dan dihantar semula kepada Ketua Blok." };
});

async function loadManaged(user: AuthUser, id: string) {
  const r = await db.resident.findUnique({ where: { id }, include: { dorm: true } });
  if (!r) throw new UserError("Rekod penghuni tidak dijumpai.");
  if (!inScope(await getScope(user), r.dormId)) throw new UserError("Rekod ini di luar bidang kuasa anda.");
  return r;
}

export const updateResidentAction = guarded("residents.manage", async (user, fd) => {
  const r = await loadManaged(user, str(fd, "id"));
  const data = readResident(fd);
  if (data.gender !== r.gender) await checkDorm(r.dormId, data.gender, r.id);
  const changes: Record<string, { dari: string | null; kepada: string | null }> = {};
  for (const k of ["fullName", "matricNo", "gender", "phone"] as const) {
    const before = r[k] ?? "";
    const after = data[k] ?? "";
    if (before !== after) changes[k] = { dari: before || null, kepada: after || null };
  }
  if (!Object.keys(changes).length) return { ok: true, message: "Tiada perubahan untuk disimpan." };
  await db.resident.update({ where: { id: r.id }, data: { ...data, phone: data.phone || null } }).catch(uniqueGuard);
  await db.residentHistory.create({ data: { residentId: r.id, action: "KEMASKINI", changes, byUserId: user.id } });
  await audit(user.id, "PENGHUNI_KEMASKINI", `Mengemas kini maklumat ${data.fullName}: ${Object.keys(changes).join(", ")}`, { entityType: "Resident", entityId: r.id, meta: changes });
  revalidatePath(`/penghuni/${r.id}`);
  return { ok: true, message: "Maklumat penghuni dikemas kini." };
});

export const transferResidentAction = guarded("residents.manage", async (user, fd) => {
  const r = await loadManaged(user, str(fd, "id"));
  const toDormId = str(fd, "toDormId");
  const note = str(fd, "note").slice(0, 255);
  if (r.status !== "AKTIF") throw new UserError("Hanya penghuni aktif boleh dipindahkan.");
  if (toDormId === r.dormId) throw new UserError("Pilih dorm yang berbeza.");
  if (!inScope(await getScope(user), toDormId)) throw new UserError("Dorm destinasi di luar bidang kuasa anda.");
  const to = await checkDorm(toDormId, r.gender);
  await db.$transaction([
    db.resident.update({ where: { id: r.id }, data: { dormId: toDormId } }),
    db.residentHistory.create({ data: { residentId: r.id, action: to.blockId === r.dorm.blockId ? "PINDAH_DORM" : "PINDAH_BLOK", fromDormId: r.dormId, toDormId, note: note || null, byUserId: user.id } }),
  ]);
  await audit(user.id, "PENGHUNI_PINDAH", `Memindahkan ${r.fullName} dari ${r.dorm.code} ke ${to.code}`, { entityType: "Resident", entityId: r.id });
  revalidatePath(`/penghuni/${r.id}`);
  return { ok: true, message: `Dipindahkan ke ${to.code}.` };
});

export const setResidentStatusAction = guarded("residents.manage", async (user, fd) => {
  const r = await loadManaged(user, str(fd, "id"));
  const activate = str(fd, "to") === "AKTIF";
  const note = str(fd, "note").slice(0, 255);
  if (!activate && note.length < 5) throw new UserError("Nyatakan sebab penyahaktifan.");
  if (activate && r.status !== "TIDAK_AKTIF") throw new UserError("Rekod ini tidak dalam status tidak aktif.");
  if (!activate && r.status !== "AKTIF") throw new UserError("Hanya penghuni aktif boleh dinyahaktifkan.");
  if (activate) await checkDorm(r.dormId, r.gender, r.id);
  await db.$transaction(async (tx) => {
    await tx.resident.update({ where: { id: r.id }, data: { status: activate ? "AKTIF" : "TIDAK_AKTIF" } });
    await tx.residentHistory.create({ data: { residentId: r.id, action: activate ? "AKTIF" : "NYAHAKTIF", note: note || null, byUserId: user.id } });
    if (!activate && r.userId) {
      await tx.user.update({ where: { id: r.userId }, data: { status: "INACTIVE" } });
      await tx.session.updateMany({ where: { userId: r.userId, revokedAt: null }, data: { revokedAt: new Date() } });
    }
  });
  await audit(user.id, activate ? "PENGHUNI_AKTIF" : "PENGHUNI_NYAHAKTIF", `${activate ? "Mengaktifkan semula" : "Menyahaktifkan"} rekod ${r.fullName}${note ? `: ${note}` : ""}`, { entityType: "Resident", entityId: r.id });
  revalidatePath(`/penghuni/${r.id}`);
  return { ok: true, message: activate ? "Rekod diaktifkan semula." : "Rekod dinyahaktifkan. Sejarah rekod dikekalkan." };
});
