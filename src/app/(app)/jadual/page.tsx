import Link from "next/link";
import clsx from "clsx";
import { db } from "@/lib/db";
import { can, requirePage } from "@/lib/auth";
import { addDays, dateOnly, dayName, fmtDate, isoOf, mondayOf, todayISO } from "@/lib/dates";
import { PageHeader, Panel } from "@/components/ui";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/forms";
import { deleteShiftAction, saveShiftAction } from "./actions";

export const metadata = { title: "Jadual bertugas Warden" };

type Shift = { id?: string; wardenUserId?: string; date?: string; startTime?: string; endTime?: string; location?: string; notes?: string | null };

function ShiftFields({ s = {}, wardens, idp }: { s?: Shift; wardens: { id: string; name: string }[]; idp: string }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor={`${idp}-w`}>Warden</label>
        <select id={`${idp}-w`} name="wardenUserId" className="input" defaultValue={s.wardenUserId ?? ""} required>
          <option value="" disabled>Pilih Warden</option>
          {wardens.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor={`${idp}-d`}>Tarikh</label>
        <input id={`${idp}-d`} type="date" name="date" className="input" defaultValue={s.date} required />
      </div>
      <div>
        <label className="field-label" htmlFor={`${idp}-s`}>Mula</label>
        <input id={`${idp}-s`} type="time" name="startTime" className="input" defaultValue={s.startTime ?? "20:00"} required />
      </div>
      <div>
        <label className="field-label" htmlFor={`${idp}-e`}>Tamat</label>
        <input id={`${idp}-e`} type="time" name="endTime" className="input" defaultValue={s.endTime ?? "23:59"} required />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor={`${idp}-l`}>Lokasi bertugas</label>
        <input id={`${idp}-l`} name="location" className="input" defaultValue={s.location} required maxLength={120} placeholder="Pondok Pengawal Blok A" />
      </div>
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor={`${idp}-n`}>Catatan (pilihan)</label>
        <input id={`${idp}-n`} name="notes" className="input" defaultValue={s.notes ?? ""} maxLength={255} />
      </div>
    </div>
  );
}

export default async function SchedulePage({ searchParams }: { searchParams: Promise<{ minggu?: string }> }) {
  const user = await requirePage("schedule.view");
  const sp = await searchParams;
  const today = todayISO();
  const monday = mondayOf(sp.minggu && /^\d{4}-\d{2}-\d{2}$/.test(sp.minggu) ? sp.minggu : today);
  const days = Array.from({ length: 7 }, (_, i) => addDays(monday, i));
  const manage = can(user, "schedule.manage");
  const [shifts, wardens] = await Promise.all([
    db.wardenSchedule.findMany({ where: { date: { gte: dateOnly(monday), lte: dateOnly(days[6]) } }, include: { warden: { select: { name: true } } }, orderBy: [{ date: "asc" }, { startTime: "asc" }] }),
    manage ? db.user.findMany({ where: { status: "ACTIVE", role: { key: { in: ["WARDEN", "KETUA_WARDEN"] } } }, select: { id: true, name: true }, orderBy: { name: "asc" } }) : [],
  ]);

  return (
    <>
      <PageHeader
        title="Jadual bertugas Warden"
        desc={`Minggu ${fmtDate(monday)} hingga ${fmtDate(days[6])}`}
        actions={
          <>
            <Link className="btn btn-ghost btn-sm" href={`/jadual?minggu=${addDays(monday, -7)}`}>Minggu lalu</Link>
            {monday !== mondayOf(today) && <Link className="btn btn-primary btn-sm" href="/jadual">Minggu ini</Link>}
            <Link className="btn btn-ghost btn-sm" href={`/jadual?minggu=${addDays(monday, 7)}`}>Minggu depan</Link>
          </>
        }
      />
      <div className={clsx("grid items-start gap-6", manage && "xl:grid-cols-[1fr_20rem]")}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 2xl:grid-cols-7">
          {days.map((iso) => {
            const list = shifts.filter((s) => isoOf(s.date) === iso);
            const isToday = iso === today;
            return (
              <section key={iso} className={clsx("panel overflow-hidden", isToday && "border-ink ring-1 ring-ink")}>
                <header className={clsx("flex items-baseline justify-between px-4 py-2.5", isToday ? "bg-ink text-white" : "border-b border-line")}>
                  <h2 className="font-display text-lg font-semibold">{dayName(iso)}</h2>
                  <span className={clsx("text-sm", isToday ? "text-tag" : "text-muted")}>{isToday ? "Hari ini" : fmtDate(iso).replace(/ \d{4}$/, "")}</span>
                </header>
                {list.length === 0 ? <p className="px-4 py-5 text-sm text-faint">Tiada giliran</p> : (
                  <ul className="divide-y divide-line-2">
                    {list.map((s) => (
                      <li key={s.id} className="px-4 py-3">
                        <p className="font-display text-[1.15rem] font-semibold">{s.startTime} hingga {s.endTime}</p>
                        <p className="font-semibold">{s.warden.name}</p>
                        <p className="text-sm text-muted">{s.location}</p>
                        {s.notes && <p className="mt-1 text-sm">{s.notes}</p>}
                        {manage && (
                          <div className="mt-2 flex gap-2">
                            <details className="w-full">
                              <summary className="cursor-pointer text-sm font-semibold text-sign">Edit</summary>
                              <ActionForm action={saveShiftAction} className="mt-3">
                                <input type="hidden" name="id" value={s.id} />
                                <ShiftFields s={{ ...s, date: isoOf(s.date) }} wardens={wardens} idp={s.id} />
                                <div className="mt-3 flex justify-between gap-2">
                                  <SubmitButton className="btn btn-primary btn-sm">Simpan</SubmitButton>
                                </div>
                              </ActionForm>
                              <div className="mt-2">
                                <ConfirmAction action={deleteShiftAction} fields={{ id: s.id }} tone="danger" size="sm" label="Padam giliran" title="Padam giliran ini?" body={`${s.warden.name}, ${dayName(iso)} ${s.startTime} hingga ${s.endTime}`} confirmLabel="Padam" />
                              </div>
                            </details>
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            );
          })}
        </div>
        {manage && (
          <Panel title="Tambah giliran">
            <ActionForm action={saveShiftAction} resetOnSuccess>
              <ShiftFields s={{ date: days.includes(today) ? today : monday }} wardens={wardens} idp="new" />
              <SubmitButton className="btn btn-tag mt-4 w-full">Tambah giliran</SubmitButton>
            </ActionForm>
          </Panel>
        )}
      </div>
    </>
  );
}
