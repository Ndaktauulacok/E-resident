"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { guarded, str, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";
import { dateOnly, fmtDate } from "@/lib/dates";

const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Masa mesti dalam format JJ:MM.");
const schema = z
  .object({
    wardenUserId: z.string().min(1, "Pilih Warden."),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Tarikh tidak sah."),
    startTime: hhmm,
    endTime: hhmm,
    location: z.string().trim().min(2, "Nyatakan lokasi bertugas.").max(120),
    notes: z.string().trim().max(255),
  })
  .refine((v) => v.startTime < v.endTime, { message: "Masa tamat mesti selepas masa mula." });

export const saveShiftAction = guarded("schedule.manage", async (user, fd) => {
  const id = str(fd, "id");
  const v = schema.parse({ wardenUserId: str(fd, "wardenUserId"), date: str(fd, "date"), startTime: str(fd, "startTime"), endTime: str(fd, "endTime"), location: str(fd, "location"), notes: str(fd, "notes") });
  const warden = await db.user.findUnique({ where: { id: v.wardenUserId }, include: { role: true } });
  if (!warden || warden.status !== "ACTIVE" || !["WARDEN", "KETUA_WARDEN"].includes(warden.role.key)) throw new UserError("Pengguna dipilih bukan Warden aktif.");
  const clash = await db.wardenSchedule.findFirst({
    where: { wardenUserId: v.wardenUserId, date: dateOnly(v.date), startTime: { lt: v.endTime }, endTime: { gt: v.startTime }, ...(id ? { id: { not: id } } : {}) },
  });
  if (clash) throw new UserError(`${warden.name} sudah bertugas ${clash.startTime} hingga ${clash.endTime} pada tarikh ini.`);
  const data = { ...v, date: dateOnly(v.date), notes: v.notes || null };
  if (id) await db.wardenSchedule.update({ where: { id }, data });
  else await db.wardenSchedule.create({ data: { ...data, createdById: user.id } });
  await audit(user.id, id ? "JADUAL_KEMASKINI" : "JADUAL_TAMBAH", `${id ? "Mengemas kini" : "Menambah"} jadual ${warden.name}, ${fmtDate(v.date)} ${v.startTime} hingga ${v.endTime}`, { entityType: "WardenSchedule", entityId: id || undefined });
  revalidatePath("/jadual");
  return { ok: true, message: id ? "Jadual dikemas kini." : "Giliran bertugas ditambah." };
});

export const deleteShiftAction = guarded("schedule.manage", async (user, fd) => {
  const s = await db.wardenSchedule.findUnique({ where: { id: str(fd, "id") }, include: { warden: { select: { name: true } } } });
  if (!s) throw new UserError("Giliran tidak dijumpai.");
  await db.wardenSchedule.delete({ where: { id: s.id } });
  await audit(user.id, "JADUAL_PADAM", `Memadam jadual ${s.warden.name}, ${fmtDate(s.date)} ${s.startTime} hingga ${s.endTime}`, { entityType: "WardenSchedule", entityId: s.id });
  revalidatePath("/jadual");
  return { ok: true, message: "Giliran dipadam." };
});
