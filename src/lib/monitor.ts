import "server-only";
import { db } from "./db";
import type { Scope } from "./auth";
import { dateOnly, todayISO } from "./dates";
import type { AttendanceStatus } from "@prisma/client";

export type Cell = { id: string; status: AttendanceStatus; present: number; absent: number; registered: number } | null;
export type BoardDorm = { id: string; code: string; residents: number; pagi: Cell; malam: Cell };
export type BoardBlock = { id: string; code: string; name: string; dorms: BoardDorm[] };

export async function getBoard(scope: Scope, iso: string): Promise<BoardBlock[]> {
  const blocks = await db.block.findMany({
    where: { isActive: true, ...(scope.all ? {} : { dorms: { some: { id: { in: scope.dormIds } } } }) },
    orderBy: { code: "asc" },
    include: {
      dorms: {
        where: { isActive: true, ...(scope.all ? {} : { id: { in: scope.dormIds } }) },
        orderBy: { code: "asc" },
        include: {
          _count: { select: { residents: { where: { status: "AKTIF" } } } },
          attendanceReports: { where: { date: dateOnly(iso) } },
        },
      },
    },
  });
  return blocks.map((b) => ({
    id: b.id,
    code: b.code,
    name: b.name,
    dorms: b.dorms.map((d) => {
      const cell = (s: "PAGI" | "MALAM"): Cell => {
        const r = d.attendanceReports.find((x) => x.session === s);
        return r ? { id: r.id, status: r.status, present: r.presentCount, absent: r.absentCount, registered: r.registeredCount } : null;
      };
      return { id: d.id, code: d.code, residents: d._count.residents, pagi: cell("PAGI"), malam: cell("MALAM") };
    }),
  }));
}

export type SessionWindow = { open: string; close: string };
export async function sessionWindows(): Promise<Record<"PAGI" | "MALAM", SessionWindow>> {
  const s = await db.systemSetting.findUnique({ where: { key: "attendance.sessions" } });
  return (s?.value as Record<"PAGI" | "MALAM", SessionWindow>) ?? { PAGI: { open: "06:00", close: "08:00" }, MALAM: { open: "21:30", close: "23:00" } };
}

/** Status sesi berbanding waktu semasa: belum dibuka / dibuka / ditutup */
export function windowState(iso: string, w: SessionWindow, now = new Date()): "akan" | "buka" | "tutup" {
  const today = todayISO(now);
  if (iso < today) return "tutup";
  if (iso > today) return "akan";
  const hm = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", minute: "2-digit", hour12: false }).format(now);
  if (hm < w.open) return "akan";
  if (hm <= w.close) return "buka";
  return "tutup";
}
