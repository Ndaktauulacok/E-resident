"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { can, getScope, inScope, isFullAccess } from "@/lib/auth";
import { guarded, str, UserError } from "@/lib/action";
import { audit, blockLeaders, blockWardens, dormLeaders, notify } from "@/lib/audit";
import { addDays, dateOnly, fmtDate, todayISO } from "@/lib/dates";
import { SESSION_LABEL } from "@/lib/labels";

const headSchema = z.object({
  dormId: z.string().min(1, "Pilih dorm."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah."),
  session: z.enum(["PAGI", "MALAM"], { message: "Pilih sesi pagi atau malam." }),
});

/** Bina rekod kehadiran daripada borang & semak konsistensi dengan senarai penghuni berdaftar */
async function readRecords(dormId: string, fd: FormData, strict = true) {
  const residents = await db.resident.findMany({ where: { dormId, status: "AKTIF" }, select: { id: true, fullName: true }, orderBy: { fullName: "asc" } });
  if (!residents.length) throw new UserError("Dorm ini belum mempunyai penghuni aktif.");
  const records = residents.map((r) => {
    const present = fd.get(`p_${r.id}`) === "1";
    const reason = str(fd, `r_${r.id}`).slice(0, 200);
    if (strict && !present && reason.length < 3) throw new UserError(`Nyatakan sebab ketidakhadiran bagi ${r.fullName}.`);
    return { residentId: r.id, present, reason: present ? null : reason };
  });
  const presentCount = records.filter((r) => r.present).length;
  return { records, registeredCount: residents.length, presentCount, absentCount: residents.length - presentCount };
}

export const submitReportAction = guarded("attendance.submit", async (user, fd) => {
  const h = headSchema.parse({ dormId: str(fd, "dormId"), date: str(fd, "date"), session: str(fd, "session") });
  const scope = await getScope(user);
  if (!inScope(scope, h.dormId)) throw new UserError("Anda hanya boleh menghantar laporan bagi dorm sendiri.");
  const today = todayISO();
  if (h.date !== today && h.date !== addDays(today, -1)) throw new UserError("Laporan hanya boleh dihantar bagi hari ini atau semalam.");
  const asDraft = str(fd, "intent") === "draf";

  const { records, ...counts } = await readRecords(h.dormId, fd, !asDraft);
  const existing = await db.attendanceReport.findUnique({ where: { dormId_date_session: { dormId: h.dormId, date: dateOnly(h.date), session: h.session } } });
  if (existing && existing.status !== "DRAF") {
    throw new UserError("Laporan rasmi bagi dorm, tarikh dan sesi ini sudah dihantar. Gunakan fungsi pindaan jika perlu pembetulan.");
  }

  const status = asDraft ? "DRAF" : "MENUNGGU_KETUA_BLOK";
  const report = await db.$transaction(async (tx) => {
    const r = existing
      ? await tx.attendanceReport.update({
          where: { id: existing.id },
          data: { ...counts, status, submittedById: user.id, submittedAt: asDraft ? null : new Date(), records: { deleteMany: {}, create: records } },
        })
      : await tx.attendanceReport.create({
          data: { dormId: h.dormId, date: dateOnly(h.date), session: h.session, ...counts, status, submittedById: user.id, submittedAt: asDraft ? null : new Date(), records: { create: records } },
        });
    if (!asDraft) await tx.approval.create({ data: { entityType: "ATTENDANCE_REPORT", entityId: r.id, stage: "DORM", action: "HANTAR", actorId: user.id } });
    return r;
  });

  const dorm = await db.dorm.findUniqueOrThrow({ where: { id: h.dormId } });
  const label = `${dorm.code} ${SESSION_LABEL[h.session].toLowerCase()} ${fmtDate(h.date)}`;
  await audit(user.id, asDraft ? "KEHADIRAN_DRAF" : "KEHADIRAN_HANTAR", `${asDraft ? "Simpan draf" : "Hantar"} laporan kehadiran ${label} (${counts.presentCount}/${counts.registeredCount} hadir)`, { entityType: "AttendanceReport", entityId: report.id });
  if (!asDraft) await notify(await blockLeaders(dorm.blockId), `Laporan ${label} menunggu semakan`, `${counts.absentCount} tidak hadir.`, `/kehadiran/${report.id}`);
  revalidatePath("/", "layout");
  redirect(`/kehadiran/${report.id}?ok=${encodeURIComponent(asDraft ? "Draf disimpan." : "Laporan dihantar untuk semakan Ketua Blok.")}`);
});

export const reviewReportAction = guarded(["attendance.review.block", "attendance.review.warden"], async (user, fd) => {
  const id = str(fd, "id");
  const decision = str(fd, "decision");
  const note = str(fd, "note").slice(0, 500);
  if (!["LULUS", "KEMBALIKAN"].includes(decision)) throw new UserError("Keputusan tidak sah.");
  if (decision === "KEMBALIKAN" && note.length < 5) throw new UserError("Nyatakan apa yang perlu dibetulkan.");

  const r = await db.attendanceReport.findUnique({ where: { id }, include: { dorm: true } });
  if (!r) throw new UserError("Laporan tidak dijumpai.");
  const scope = await getScope(user);
  if (!inScope(scope, r.dormId)) throw new UserError("Laporan ini di luar bidang kuasa anda.");
  if (r.submittedById === user.id && !isFullAccess(user)) throw new UserError("Anda tidak boleh menyemak laporan yang anda hantar sendiri.");

  let stage: "KETUA_BLOK" | "WARDEN";
  let next: "MENUNGGU_WARDEN" | "SELESAI" | "PERLU_PEMBETULAN";
  if (r.status === "MENUNGGU_KETUA_BLOK") {
    if (!can(user, "attendance.review.block")) throw new UserError("Laporan ini menunggu semakan Ketua Blok.");
    stage = "KETUA_BLOK";
    next = decision === "LULUS" ? "MENUNGGU_WARDEN" : "PERLU_PEMBETULAN";
  } else if (r.status === "MENUNGGU_WARDEN") {
    if (!can(user, "attendance.review.warden")) throw new UserError("Laporan ini menunggu semakan Warden.");
    stage = "WARDEN";
    next = decision === "LULUS" ? "SELESAI" : "PERLU_PEMBETULAN";
  } else throw new UserError("Laporan ini tidak menunggu semakan.");

  // Kemas kini bersyarat: elak dua penyemak bertindak serentak
  const res = await db.$transaction(async (tx) => {
    const u = await tx.attendanceReport.updateMany({ where: { id, status: r.status }, data: { status: next } });
    if (u.count) await tx.approval.create({ data: { entityType: "ATTENDANCE_REPORT", entityId: id, stage, action: decision as "LULUS" | "KEMBALIKAN", actorId: user.id, note: note || null } });
    return u.count;
  });
  if (!res) throw new UserError("Laporan ini telah dikemas kini oleh penyemak lain. Muat semula halaman.");

  const label = `${r.dorm.code} ${SESSION_LABEL[r.session].toLowerCase()} ${fmtDate(r.date)}`;
  await audit(user.id, decision === "LULUS" ? "KEHADIRAN_LULUS" : "KEHADIRAN_KEMBALI", `${decision === "LULUS" ? "Meluluskan" : "Mengembalikan"} laporan ${label} (peringkat ${stage === "WARDEN" ? "Warden" : "Ketua Blok"})`, { entityType: "AttendanceReport", entityId: id });
  if (next === "PERLU_PEMBETULAN") await notify([r.submittedById, ...(await dormLeaders(r.dormId))], `Laporan ${label} perlu dibetulkan`, note, `/kehadiran/${id}`);
  if (next === "MENUNGGU_WARDEN") await notify(await blockWardens(r.dorm.blockId), `Laporan ${label} menunggu semakan Warden`, undefined, `/kehadiran/${id}`);
  if (next === "SELESAI") await notify([r.submittedById], `Laporan ${label} selesai disemak`, undefined, `/kehadiran/${id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: decision === "LULUS" ? "Laporan diluluskan." : "Laporan dikembalikan untuk pembetulan." };
});

export const amendReportAction = guarded(["attendance.submit", "attendance.amend.any"], async (user, fd) => {
  const id = str(fd, "id");
  const reason = str(fd, "reason").slice(0, 255);
  if (reason.length < 5) throw new UserError("Nyatakan sebab pindaan (sekurang-kurangnya 5 aksara).");
  const r = await db.attendanceReport.findUnique({ where: { id }, include: { records: true, dorm: true } });
  if (!r) throw new UserError("Laporan tidak dijumpai.");
  const scope = await getScope(user);
  const byDorm = r.status === "PERLU_PEMBETULAN" && can(user, "attendance.submit") && inScope(scope, r.dormId);
  const byAdmin = can(user, "attendance.amend.any");
  if (!byDorm && !byAdmin) throw new UserError("Laporan ini tidak boleh dipinda oleh anda pada status sekarang.");

  const { records, ...counts } = await readRecords(r.dormId, fd);
  const snapshot = (list: { residentId: string; present: boolean; reason: string | null }[]) =>
    list.map((x) => ({ residentId: x.residentId, present: x.present, reason: x.reason }));
  const newStatus = byDorm && r.status === "PERLU_PEMBETULAN" ? "MENUNGGU_KETUA_BLOK" : r.status;

  await db.$transaction(async (tx) => {
    await tx.attendanceAmendment.create({
      data: { reportId: id, byUserId: user.id, reason, before: { ...{ present: r.presentCount, absent: r.absentCount }, records: snapshot(r.records) }, after: { present: counts.presentCount, absent: counts.absentCount, records: snapshot(records) } },
    });
    await tx.attendanceReport.update({ where: { id }, data: { ...counts, status: newStatus, records: { deleteMany: {}, create: records } } });
    await tx.approval.create({ data: { entityType: "ATTENDANCE_REPORT", entityId: id, stage: byDorm ? "DORM" : "ADMIN", action: "PINDA", actorId: user.id, note: reason } });
  });
  const label = `${r.dorm.code} ${SESSION_LABEL[r.session].toLowerCase()} ${fmtDate(r.date)}`;
  await audit(user.id, "KEHADIRAN_PINDA", `Meminda laporan ${label}: ${reason}`, { entityType: "AttendanceReport", entityId: id, meta: { before: { present: r.presentCount, absent: r.absentCount }, after: { present: counts.presentCount, absent: counts.absentCount } } });
  if (newStatus === "MENUNGGU_KETUA_BLOK") await notify(await blockLeaders(r.dorm.blockId), `Laporan ${label} dihantar semula selepas pembetulan`, reason, `/kehadiran/${id}`);
  revalidatePath("/", "layout");
  return { ok: true, message: newStatus === "MENUNGGU_KETUA_BLOK" ? "Pindaan disimpan dan laporan dihantar semula untuk semakan." : "Pindaan disimpan dan direkodkan." };
});
