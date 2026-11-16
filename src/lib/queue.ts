import "server-only";
import { db } from "./db";
import { can, isFullAccess, type AuthUser, type Scope } from "./auth";
import { ATTENDANCE_STATUS, REGISTRATION_STATUS, SESSION_LABEL, type Tone } from "./labels";
import { fmtDate } from "./dates";
import type { AttendanceStatus, RegistrationStatus } from "@prisma/client";

export type QueueItem = {
  kind: "Kehadiran" | "Pendaftaran";
  id: string;
  title: string;
  place: string;
  statusLabel: string;
  tone: Tone;
  when: Date;
  by: string;
  next: string;
  href: string;
};

/** Semua item yang memerlukan tindakan pengguna ini (ikut kebenaran & skop) */
export async function getQueue(user: AuthUser, scope: Scope): Promise<QueueItem[]> {
  const dormWhere = scope.all ? {} : { dormId: { in: scope.dormIds } };
  const aStatuses: AttendanceStatus[] = [];
  const rStatuses: RegistrationStatus[] = [];
  if (can(user, "attendance.review.block")) aStatuses.push("MENUNGGU_KETUA_BLOK");
  if (can(user, "attendance.review.warden")) aStatuses.push("MENUNGGU_WARDEN");
  if (can(user, "attendance.submit") && !isFullAccess(user)) aStatuses.push("PERLU_PEMBETULAN");
  if (can(user, "registration.review.block")) rStatuses.push("MENUNGGU_KETUA_BLOK");
  if (can(user, "registration.review.warden")) rStatuses.push("MENUNGGU_WARDEN");
  if (can(user, "residents.register") && !isFullAccess(user)) rStatuses.push("PERLU_PEMBETULAN");
  if (!scope.all && scope.dormIds.length === 0) return [];

  const [reports, regs] = await Promise.all([
    aStatuses.length
      ? db.attendanceReport.findMany({
          where: { status: { in: aStatuses }, ...dormWhere },
          include: { dorm: { include: { block: true } }, submittedBy: { select: { name: true } } },
          orderBy: [{ date: "asc" }, { submittedAt: "asc" }],
          take: 200,
        })
      : [],
    rStatuses.length
      ? db.residentRegistration.findMany({
          where: { status: { in: rStatuses }, resident: scope.all ? {} : { dormId: { in: scope.dormIds } } },
          include: { resident: { include: { dorm: { include: { block: true } } } }, submittedBy: { select: { name: true } } },
          orderBy: { submittedAt: "asc" },
          take: 200,
        })
      : [],
  ]);

  const nextA: Record<string, string> = {
    MENUNGGU_KETUA_BLOK: "Semakan Ketua Blok",
    MENUNGGU_WARDEN: "Semakan Warden",
    PERLU_PEMBETULAN: "Pembetulan oleh dorm",
  };
  const nextR: Record<string, string> = {
    MENUNGGU_KETUA_BLOK: "Semakan Ketua Blok",
    MENUNGGU_WARDEN: "Pengesahan Warden",
    PERLU_PEMBETULAN: "Pembetulan oleh dorm",
  };

  return [
    ...reports.map((r) => ({
      kind: "Kehadiran" as const,
      id: r.id,
      title: `Kehadiran ${SESSION_LABEL[r.session].toLowerCase()}, ${fmtDate(r.date)}`,
      place: `${r.dorm.code}, Blok ${r.dorm.block.name}`,
      statusLabel: ATTENDANCE_STATUS[r.status].label,
      tone: ATTENDANCE_STATUS[r.status].tone,
      when: r.submittedAt ?? r.createdAt,
      by: r.submittedBy.name,
      next: nextA[r.status],
      href: `/kehadiran/${r.id}`,
    })),
    ...regs.map((g) => ({
      kind: "Pendaftaran" as const,
      id: g.id,
      title: `Pendaftaran ${g.resident.fullName}`,
      place: `${g.resident.dorm.code}, Blok ${g.resident.dorm.block.name}`,
      statusLabel: REGISTRATION_STATUS[g.status].label,
      tone: REGISTRATION_STATUS[g.status].tone,
      when: g.submittedAt,
      by: g.submittedBy.name,
      next: nextR[g.status],
      href: `/pendaftaran/${g.id}`,
    })),
  ].sort((a, b) => a.when.getTime() - b.when.getTime());
}
