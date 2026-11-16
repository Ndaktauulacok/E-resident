import "server-only";
import { db } from "./db";
import type { Scope } from "./auth";
import { addDays, dateOnly, dayName, isoOf, todayISO } from "./dates";
import type { RatePoint } from "@/components/charts";

/** Kadar kehadiran harian (laporan yang telah dihantar sahaja) */
export async function rateSeries(scope: Scope, days = 7): Promise<RatePoint[]> {
  const today = todayISO();
  const from = addDays(today, -(days - 1));
  const rows = await db.attendanceReport.findMany({
    where: { date: { gte: dateOnly(from), lte: dateOnly(today) }, status: { not: "DRAF" }, ...(scope.all ? {} : { dormId: { in: scope.dormIds } }) },
    select: { date: true, session: true, presentCount: true, registeredCount: true },
  });
  const out: RatePoint[] = [];
  for (let i = 0; i < days; i++) {
    const iso = addDays(from, i);
    const rate = (s: "PAGI" | "MALAM") => {
      const r = rows.filter((x) => isoOf(x.date) === iso && x.session === s);
      const reg = r.reduce((a, x) => a + x.registeredCount, 0);
      return reg ? Math.round((r.reduce((a, x) => a + x.presentCount, 0) / reg) * 1000) / 10 : null;
    };
    out.push({ label: `${dayName(iso).slice(0, 3)} ${Number(iso.slice(8))}`, pagi: rate("PAGI"), malam: rate("MALAM") });
  }
  return out;
}

export async function headcounts(scope: Scope) {
  const dormWhere = scope.all ? {} : { id: { in: scope.dormIds } };
  const [residents, blocks, dorms, wardens] = await Promise.all([
    db.resident.count({ where: { status: "AKTIF", dorm: dormWhere } }),
    db.block.count({ where: { isActive: true, ...(scope.all ? {} : { id: { in: scope.blockIds } }) } }),
    db.dorm.count({ where: { isActive: true, ...dormWhere } }),
    db.user.count({ where: { status: "ACTIVE", role: { key: { in: ["WARDEN", "KETUA_WARDEN"] } } } }),
  ]);
  return { residents, blocks, dorms, wardens };
}
