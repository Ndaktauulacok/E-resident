import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { can, dormFilter, getScope, requirePage } from "@/lib/auth";
import { dateOnly, fmtDate, fmtTime } from "@/lib/dates";
import { ATTENDANCE_STATUS, SESSION_LABEL } from "@/lib/labels";
import { Badge, EmptyState, PAGE_SIZE, PageHeader, Pagination, pageOf } from "@/components/ui";

export const metadata = { title: "Laporan kehadiran" };

export default async function AttendanceListPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePage("attendance.view");
  const scope = await getScope(user);
  const sp = await searchParams;
  const page = pageOf(sp);

  const blocks = await db.block.findMany({ where: scope.all ? {} : { id: { in: scope.blockIds } }, orderBy: { code: "asc" } });
  const where: Prisma.AttendanceReportWhereInput = {
    dorm: { ...dormFilter(scope), ...(sp.blok ? { blockId: sp.blok } : {}) },
    ...(sp.tarikh && /^\d{4}-\d{2}-\d{2}$/.test(sp.tarikh) ? { date: dateOnly(sp.tarikh) } : {}),
    ...(sp.sesi === "PAGI" || sp.sesi === "MALAM" ? { session: sp.sesi } : {}),
    ...(sp.status && sp.status in ATTENDANCE_STATUS ? { status: sp.status as keyof typeof ATTENDANCE_STATUS & Prisma.EnumAttendanceStatusFilter["equals"] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.attendanceReport.count({ where }),
    db.attendanceReport.findMany({
      where,
      include: { dorm: { include: { block: true } }, submittedBy: { select: { name: true } } },
      orderBy: [{ date: "desc" }, { session: "desc" }, { dorm: { code: "asc" } }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);

  return (
    <>
      <PageHeader
        title="Laporan kehadiran"
        desc="Laporan pagi dan malam bagi setiap dorm dalam bidang kuasa anda."
        actions={can(user, "attendance.submit") && <Link href="/kehadiran/hantar" className="btn btn-tag">Hantar laporan</Link>}
      />

      <form method="get" className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,1fr)_auto]">
        <input type="date" name="tarikh" defaultValue={sp.tarikh} className="input" aria-label="Tarikh" />
        <select name="sesi" defaultValue={sp.sesi ?? ""} className="input" aria-label="Sesi">
          <option value="">Semua sesi</option><option value="PAGI">Pagi</option><option value="MALAM">Malam</option>
        </select>
        <select name="blok" defaultValue={sp.blok ?? ""} className="input" aria-label="Blok">
          <option value="">Semua blok</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>Blok {b.code}, {b.name}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Status">
          <option value="">Semua status</option>
          {Object.entries(ATTENDANCE_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex gap-2">
          <button className="btn btn-primary">Tapis</button>
          <Link href="/kehadiran" className="btn btn-ghost">Set semula</Link>
        </div>
      </form>

      <div className="panel overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title="Tiada laporan untuk penapis ini" desc="Cuba tukar tarikh, sesi atau status." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr><th>Tarikh</th><th>Sesi</th><th>Dorm</th><th className="text-right">Hadir</th><th className="text-right">Tidak hadir</th><th>Status</th><th>Pelapor</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap">{fmtDate(r.date)}</td>
                    <td>{SESSION_LABEL[r.session]}</td>
                    <td className="whitespace-nowrap"><span className="font-display text-[1.05rem] font-semibold">{r.dorm.code}</span> <span className="text-sm text-muted">{r.dorm.block.name}</span></td>
                    <td className="text-right font-medium">{r.presentCount}/{r.registeredCount}</td>
                    <td className={`text-right font-medium ${r.absentCount ? "text-danger" : "text-muted"}`}>{r.absentCount}</td>
                    <td><Badge tone={ATTENDANCE_STATUS[r.status].tone}>{ATTENDANCE_STATUS[r.status].label}</Badge></td>
                    <td className="whitespace-nowrap text-sm">{r.submittedBy.name}{r.submittedAt && <span className="block text-muted">{fmtTime(r.submittedAt)}</span>}</td>
                    <td className="text-right"><Link className="link" href={`/kehadiran/${r.id}`}>Buka</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total} params={sp} basePath="/kehadiran" />
      </div>
    </>
  );
}
