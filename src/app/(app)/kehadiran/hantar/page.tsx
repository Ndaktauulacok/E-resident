import Link from "next/link";
import { db } from "@/lib/db";
import { dormFilter, getScope, requirePage } from "@/lib/auth";
import { addDays, currentHourMY, dateOnly, fmtDate, todayISO } from "@/lib/dates";
import { ATTENDANCE_STATUS, SESSION_LABEL } from "@/lib/labels";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { AttendanceRoster } from "@/components/attendance-form";
import { submitReportAction } from "../actions";

export const metadata = { title: "Hantar laporan kehadiran" };

export default async function SubmitAttendancePage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePage("attendance.submit");
  const scope = await getScope(user);
  const sp = await searchParams;
  const dorms = await db.dorm.findMany({ where: { ...dormFilter(scope), isActive: true }, include: { block: true }, orderBy: { code: "asc" } });
  if (!dorms.length) {
    return (
      <>
        <PageHeader title="Hantar laporan kehadiran" back={{ href: "/kehadiran", label: "Laporan kehadiran" }} />
        <div className="panel"><EmptyState title="Anda belum ditetapkan kepada mana-mana dorm" desc="Minta Admin atau Ketua Warden menetapkan anda sebagai Ketua Dorm atau Penolong Ketua Dorm." /></div>
      </>
    );
  }

  const today = todayISO();
  const date = sp.date === addDays(today, -1) ? sp.date : today;
  const session = sp.session === "PAGI" || sp.session === "MALAM" ? sp.session : currentHourMY() < 15 ? "PAGI" : "MALAM";
  const dorm = dorms.find((d) => d.id === sp.dorm) ?? dorms[0];

  const [existing, residents] = await Promise.all([
    db.attendanceReport.findUnique({ where: { dormId_date_session: { dormId: dorm.id, date: dateOnly(date), session } }, include: { records: true } }),
    db.resident.findMany({ where: { dormId: dorm.id, status: "AKTIF" }, orderBy: { fullName: "asc" } }),
  ]);
  const prev = new Map(existing?.records.map((r) => [r.residentId, r]) ?? []);

  return (
    <>
      <PageHeader
        title="Hantar laporan kehadiran"
        desc="Tandakan setiap penghuni. Hanya satu laporan rasmi dibenarkan bagi setiap dorm, tarikh dan sesi."
        back={{ href: "/kehadiran", label: "Laporan kehadiran" }}
      />

      <form className="panel mb-6 grid gap-4 p-5 sm:grid-cols-[1fr_1fr_1fr_auto] sm:items-end" method="get">
        <div>
          <label className="field-label" htmlFor="f-dorm">Dorm</label>
          <select id="f-dorm" name="dorm" className="input" defaultValue={dorm.id}>
            {dorms.map((d) => <option key={d.id} value={d.id}>{d.code}, Blok {d.block.name}</option>)}
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="f-date">Tarikh</label>
          <select id="f-date" name="date" className="input" defaultValue={date}>
            <option value={today}>Hari ini, {fmtDate(today)}</option>
            <option value={addDays(today, -1)}>Semalam, {fmtDate(addDays(today, -1))}</option>
          </select>
        </div>
        <div>
          <label className="field-label" htmlFor="f-session">Sesi</label>
          <select id="f-session" name="session" className="input" defaultValue={session}>
            <option value="PAGI">Pagi</option>
            <option value="MALAM">Malam</option>
          </select>
        </div>
        <button className="btn btn-ghost">Tukar</button>
      </form>

      {existing && existing.status !== "DRAF" ? (
        <Panel>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="font-display text-xl font-semibold">Laporan {dorm.code} sesi {SESSION_LABEL[session].toLowerCase()}, {fmtDate(date)} sudah dihantar</p>
              <div className="mt-2"><Badge tone={ATTENDANCE_STATUS[existing.status].tone}>{ATTENDANCE_STATUS[existing.status].label}</Badge></div>
            </div>
            <Link className="btn btn-primary" href={`/kehadiran/${existing.id}`}>Buka laporan</Link>
          </div>
        </Panel>
      ) : residents.length === 0 ? (
        <div className="panel"><EmptyState title="Tiada penghuni aktif dalam dorm ini" desc="Daftarkan penghuni terlebih dahulu sebelum menghantar laporan." action={<Link href="/penghuni/baru" className="btn btn-primary">Daftar penghuni</Link>} /></div>
      ) : (
        <ActionForm action={submitReportAction} refresh={false}>
          <input type="hidden" name="dormId" value={dorm.id} />
          <input type="hidden" name="date" value={date} />
          <input type="hidden" name="session" value={session} />
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="font-display text-2xl font-bold">{dorm.code}, sesi {SESSION_LABEL[session].toLowerCase()}, {fmtDate(date, true)}</h2>
            {existing?.status === "DRAF" && <Badge>Menyambung draf</Badge>}
          </div>
          <AttendanceRoster
            rows={residents.map((r) => ({ id: r.id, name: r.fullName, matric: r.matricNo, present: prev.get(r.id)?.present ?? true, reason: prev.get(r.id)?.reason ?? "" }))}
          />
          <div className="mt-6 flex flex-wrap items-center justify-end gap-3">
            <p className="mr-auto text-sm text-muted">Pelapor: <b className="text-ink">{user.name}</b>. Masa penghantaran direkod secara automatik.</p>
            <SubmitButton className="btn btn-ghost" name="intent" value="draf" formNoValidate>Simpan draf</SubmitButton>
            <SubmitButton className="btn btn-tag" name="intent" value="hantar" pendingText="Menghantar…">Hantar laporan</SubmitButton>
          </div>
        </ActionForm>
      )}
    </>
  );
}
