import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, getScope, inScope, isFullAccess, requirePage } from "@/lib/auth";
import { fmtDate, fmtDateTime, isoOf } from "@/lib/dates";
import { ATTENDANCE_STATUS, SESSION_LABEL } from "@/lib/labels";
import { Badge, PageHeader, Panel } from "@/components/ui";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/forms";
import { AttendanceRoster } from "@/components/attendance-form";
import { ApprovalTrail } from "@/components/trail";
import { amendReportAction, reviewReportAction } from "../actions";

export const metadata = { title: "Laporan kehadiran" };

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("attendance.view");
  const { id } = await params;
  const r = await db.attendanceReport.findUnique({
    where: { id },
    include: {
      dorm: { include: { block: true } },
      submittedBy: { select: { name: true } },
      records: { include: { resident: { select: { fullName: true, matricNo: true } } }, orderBy: { resident: { fullName: "asc" } } },
      amendments: { include: { byUser: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
    },
  });
  if (!r) notFound();
  const scope = await getScope(user);
  if (!inScope(scope, r.dormId)) redirect("/tiada-akses");

  const st = ATTENDANCE_STATUS[r.status];
  const ownSubmission = r.submittedById === user.id && !isFullAccess(user);
  const reviewStage =
    r.status === "MENUNGGU_KETUA_BLOK" && can(user, "attendance.review.block") ? "Ketua Blok" :
    r.status === "MENUNGGU_WARDEN" && can(user, "attendance.review.warden") ? "Warden" : null;
  const canReview = !!reviewStage && !ownSubmission;
  const canAmendDorm = r.status === "PERLU_PEMBETULAN" && can(user, "attendance.submit");
  const canAmendAdmin = r.status !== "DRAF" && can(user, "attendance.amend.any");
  const lastReturn = r.status === "PERLU_PEMBETULAN"
    ? await db.approval.findFirst({ where: { entityType: "ATTENDANCE_REPORT", entityId: r.id, action: "KEMBALIKAN" }, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } })
    : null;
  const absent = r.records.filter((x) => !x.present);
  const title = `${r.dorm.code}, sesi ${SESSION_LABEL[r.session].toLowerCase()}`;

  return (
    <>
      <PageHeader
        title={title}
        desc={<>{fmtDate(r.date, true)}, Blok {r.dorm.block.name}</>}
        back={{ href: "/kehadiran", label: "Laporan kehadiran" }}
        actions={<Badge tone={st.tone} className="!text-sm">{st.label}</Badge>}
      />

      {lastReturn && (
        <div className="mb-6 rounded-[12px] border border-[#efc4ca] bg-danger-soft px-5 py-4">
          <p className="font-semibold text-[#8f1f2e]">Dikembalikan oleh {lastReturn.actor.name}</p>
          <p className="mt-1 text-[#8f1f2e]">{lastReturn.note}</p>
        </div>
      )}

      {r.status === "DRAF" && can(user, "attendance.submit") && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-[12px] border border-line bg-white px-5 py-4">
          <p>Laporan ini masih draf dan belum dihantar untuk semakan.</p>
          <Link className="btn btn-tag" href={`/kehadiran/hantar?dorm=${r.dormId}&date=${isoOf(r.date)}&session=${r.session}`}>Sambung &amp; hantar</Link>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <section className="panel grid grid-cols-3 divide-x divide-line">
            {[["Berdaftar", r.registeredCount, ""], ["Hadir", r.presentCount, "text-ok"], ["Tidak hadir", r.absentCount, r.absentCount ? "text-danger" : ""]].map(([l, v, c]) => (
              <div key={l as string} className="px-5 py-4">
                <p className="text-sm font-medium text-muted">{l}</p>
                <p className={`font-display text-[2.6rem] font-bold leading-none ${c}`}>{v}</p>
              </div>
            ))}
          </section>

          <Panel title={`Tidak hadir (${absent.length})`} pad={false}>
            {absent.length === 0 ? (
              <p className="px-5 py-6 text-muted">Semua penghuni hadir.</p>
            ) : (
              <ul className="divide-y divide-line-2">
                {absent.map((a) => (
                  <li key={a.id} className="flex flex-wrap justify-between gap-2 px-5 py-3">
                    <span><b>{a.resident.fullName}</b> <span className="text-sm text-muted">{a.resident.matricNo}</span></span>
                    <span className="text-sm">{a.reason}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {(canAmendDorm || canAmendAdmin) && (
            <details className="panel group" open={canAmendDorm}>
              <summary className="flex cursor-pointer items-center justify-between px-5 py-3.5 font-display text-[1.2rem] font-semibold">
                {canAmendDorm ? "Betulkan & hantar semula" : "Pinda laporan"}
                <span className="text-sm font-sans font-medium text-muted group-open:hidden">Buka</span>
              </summary>
              <div className="border-t border-line p-5">
                <ActionForm action={amendReportAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <AttendanceRoster rows={r.records.map((x) => ({ id: x.residentId, name: x.resident.fullName, matric: x.resident.matricNo, present: x.present, reason: x.reason ?? "" }))} />
                  <div className="mt-5">
                    <label className="field-label" htmlFor="reason">Sebab pindaan</label>
                    <textarea id="reason" name="reason" className="input" rows={2} required minLength={5} maxLength={255} placeholder="Contoh: Sebab tidak hadir dilengkapkan seperti diminta Ketua Blok." />
                    <p className="field-hint">Setiap pindaan disimpan bersama nilai sebelum dan selepas.</p>
                  </div>
                  <div className="mt-4 flex justify-end">
                    <SubmitButton className="btn btn-tag">{canAmendDorm ? "Simpan pindaan & hantar semula" : "Simpan pindaan"}</SubmitButton>
                  </div>
                </ActionForm>
              </div>
            </details>
          )}

          <Panel title="Senarai penuh" pad={false}>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Nama</th><th>No. matrik</th><th>Kehadiran</th><th>Sebab</th></tr></thead>
                <tbody>
                  {r.records.map((x) => (
                    <tr key={x.id}>
                      <td className="font-medium">{x.resident.fullName}</td>
                      <td className="text-muted">{x.resident.matricNo}</td>
                      <td>{x.present ? <Badge tone="ok">Hadir</Badge> : <Badge tone="danger">Tidak hadir</Badge>}</td>
                      <td className="text-sm">{x.reason ?? ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        </div>

        <aside className="space-y-6">
          {reviewStage && (
            <Panel title={`Semakan ${reviewStage}`}>
              {ownSubmission ? (
                <p className="text-sm text-muted">Anda menghantar laporan ini. Semakan mesti dibuat oleh pengguna lain.</p>
              ) : canReview ? (
                <div className="flex flex-col gap-2">
                  <ConfirmAction
                    action={reviewReportAction} fields={{ id: r.id, decision: "LULUS" }} tone="ok" label="Luluskan laporan"
                    title="Luluskan laporan ini?" confirmLabel="Luluskan"
                    body={reviewStage === "Warden" ? "Laporan akan ditanda selesai." : "Laporan akan dihantar kepada Warden untuk semakan seterusnya."}
                    note="Catatan (pilihan)"
                  />
                  <ConfirmAction
                    action={reviewReportAction} fields={{ id: r.id, decision: "KEMBALIKAN" }} tone="danger" label="Kembalikan untuk pembetulan"
                    title="Kembalikan kepada dorm?" confirmLabel="Kembalikan" note="Apa yang perlu dibetulkan?" noteRequired
                  />
                </div>
              ) : null}
            </Panel>
          )}

          <Panel title="Maklumat laporan">
            <dl className="space-y-3 text-[0.93rem]">
              <div><dt className="text-[0.8rem] text-muted">Pelapor</dt><dd className="font-medium">{r.submittedBy.name}</dd></div>
              <div><dt className="text-[0.8rem] text-muted">Masa penghantaran</dt><dd className="font-medium">{r.submittedAt ? fmtDateTime(r.submittedAt) : "Belum dihantar"}</dd></div>
              <div><dt className="text-[0.8rem] text-muted">Dorm</dt><dd className="font-medium"><Link className="link" href={`/dorm/${r.dormId}`}>{r.dorm.code}</Link></dd></div>
            </dl>
          </Panel>

          <Panel title="Jejak semakan">
            <ApprovalTrail entityType="ATTENDANCE_REPORT" entityId={r.id} />
          </Panel>

          {r.amendments.length > 0 && (
            <Panel title={`Pindaan (${r.amendments.length})`}>
              <ul className="space-y-4 text-sm">
                {r.amendments.map((a) => {
                  const b = a.before as { present: number; absent: number };
                  const f = a.after as { present: number; absent: number };
                  return (
                    <li key={a.id}>
                      <p><b>{a.byUser.name}</b>, {fmtDateTime(a.createdAt)}</p>
                      <p className="text-muted">Hadir {b.present} kepada {f.present}, tidak hadir {b.absent} kepada {f.absent}</p>
                      <p className="mt-1">{a.reason}</p>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
