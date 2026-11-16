import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, dormFilter, getScope, inScope, requirePage } from "@/lib/auth";
import { fmtDate, fmtDateTime } from "@/lib/dates";
import { RESIDENT_STATUS, SESSION_LABEL } from "@/lib/labels";
import { Badge, DL, PageHeader, Panel } from "@/components/ui";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/forms";
import { ResidentFields } from "../fields";
import { setResidentStatusAction, transferResidentAction, updateResidentAction } from "../actions";

export const metadata = { title: "Penghuni" };

const ACTION_LABEL: Record<string, string> = {
  DAFTAR: "Didaftarkan", KEMASKINI: "Maklumat dikemas kini", PINDAH_DORM: "Pindah dorm", PINDAH_BLOK: "Pindah blok", NYAHAKTIF: "Dinyahaktifkan", AKTIF: "Diaktifkan",
};
const FIELD: Record<string, string> = { fullName: "Nama", matricNo: "No. matrik", gender: "Jantina", phone: "Telefon" };

export default async function ResidentPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("residents.view");
  const { id } = await params;
  const r = await db.resident.findUnique({
    where: { id },
    include: {
      dorm: { include: { block: true } },
      user: { select: { username: true, status: true, role: { select: { name: true } } } },
      history: { include: { byUser: { select: { name: true } } }, orderBy: { createdAt: "desc" } },
      registrations: { orderBy: { submittedAt: "desc" }, take: 1 },
    },
  });
  if (!r) notFound();
  const scope = await getScope(user);
  if (!inScope(scope, r.dormId)) redirect("/tiada-akses");

  const manage = can(user, "residents.manage");
  const [dormNames, transferTargets, absences] = await Promise.all([
    db.dorm.findMany({ where: { id: { in: r.history.flatMap((h) => [h.fromDormId, h.toDormId]).filter(Boolean) as string[] } }, select: { id: true, code: true } }),
    manage ? db.dorm.findMany({ where: { ...dormFilter(scope), isActive: true, id: { not: r.dormId }, block: { gender: r.gender } }, include: { block: true }, orderBy: { code: "asc" } }) : [],
    db.attendanceRecord.findMany({ where: { residentId: r.id, present: false, report: { status: { not: "DRAF" } } }, include: { report: { select: { id: true, date: true, session: true } } }, orderBy: { report: { date: "desc" } }, take: 6 }),
  ]);
  const code = new Map(dormNames.map((d) => [d.id, d.code]));
  const st = RESIDENT_STATUS[r.status];

  return (
    <>
      <PageHeader
        title={r.fullName}
        desc={<>{r.matricNo}, {r.dorm.code} Blok {r.dorm.block.name}</>}
        back={{ href: "/penghuni", label: "Penghuni" }}
        actions={<Badge tone={st.tone} className="!text-sm">{st.label}</Badge>}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title="Maklumat penghuni">
            <DL items={[
              ["Nama penuh", r.fullName], ["No. matrik", r.matricNo],
              ["Jantina", r.gender === "LELAKI" ? "Lelaki" : "Perempuan"], ["No. telefon", r.phone],
              ["Blok", `${r.dorm.block.code}, ${r.dorm.block.name}`], ["Dorm", <Link key="d" className="link" href={`/dorm/${r.dormId}`}>{r.dorm.code}</Link>],
              ["Tarikh pendaftaran", fmtDate(r.registeredAt)], ["Akaun login", r.user ? `${r.user.username} (${r.user.status === "ACTIVE" ? "aktif" : r.user.status === "PENDING_ACTIVATION" ? "belum diaktifkan" : "dinyahaktifkan"})` : "Tiada"],
            ]} />
            {r.registrations[0] && r.status === "MENUNGGU_PENDAFTARAN" && (
              <Link href={`/pendaftaran/${r.registrations[0].id}`} className="btn btn-ghost btn-sm mt-5">Lihat permohonan pendaftaran</Link>
            )}
          </Panel>

          {manage && r.status !== "DITOLAK" && r.status !== "MENUNGGU_PENDAFTARAN" && (
            <details className="panel group">
              <summary className="cursor-pointer px-5 py-3.5 font-display text-[1.2rem] font-semibold">Edit maklumat</summary>
              <div className="border-t border-line p-5">
                <ActionForm action={updateResidentAction}>
                  <input type="hidden" name="id" value={r.id} />
                  <ResidentFields r={r} />
                  <div className="mt-5 flex justify-end"><SubmitButton>Simpan perubahan</SubmitButton></div>
                </ActionForm>
              </div>
            </details>
          )}

          {manage && r.status === "AKTIF" && (
            <details className="panel">
              <summary className="cursor-pointer px-5 py-3.5 font-display text-[1.2rem] font-semibold">Pindah dorm atau blok</summary>
              <div className="border-t border-line p-5">
                <ActionForm action={transferResidentAction} className="grid gap-4 sm:grid-cols-[1fr_1.4fr_auto] sm:items-end">
                  <input type="hidden" name="id" value={r.id} />
                  <div>
                    <label className="field-label" htmlFor="toDormId">Dorm baharu</label>
                    <select id="toDormId" name="toDormId" className="input" required defaultValue="">
                      <option value="" disabled>Pilih dorm</option>
                      {transferTargets.map((d) => <option key={d.id} value={d.id}>{d.code}, Blok {d.block.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="field-label" htmlFor="tnote">Catatan</label>
                    <input id="tnote" name="note" className="input" maxLength={255} placeholder="Contoh: Permintaan penghuni, diluluskan Warden" />
                  </div>
                  <SubmitButton>Pindahkan</SubmitButton>
                </ActionForm>
              </div>
            </details>
          )}

          <Panel title="Sejarah perubahan">
            <ol className="space-y-4">
              {r.history.map((h) => {
                const changes = h.changes as Record<string, { dari: string | null; kepada: string | null }> | null;
                return (
                  <li key={h.id} className="border-l-2 border-line pl-4">
                    <p className="font-semibold">
                      {ACTION_LABEL[h.action] ?? h.action}
                      {h.fromDormId && h.toDormId && <span className="font-normal"> dari {code.get(h.fromDormId)} ke {code.get(h.toDormId)}</span>}
                      {!h.fromDormId && h.toDormId && h.action === "DAFTAR" && <span className="font-normal"> ke {code.get(h.toDormId)}</span>}
                    </p>
                    <p className="text-[0.8rem] text-muted">{h.byUser?.name ?? "Sistem"}, {fmtDateTime(h.createdAt)}</p>
                    {changes && (
                      <ul className="mt-1 text-sm">
                        {Object.entries(changes).map(([k, v]) => <li key={k}>{FIELD[k] ?? k}: <span className="text-muted line-through">{v.dari ?? "kosong"}</span> {v.kepada ?? "kosong"}</li>)}
                      </ul>
                    )}
                    {h.note && <p className="mt-1 text-sm">{h.note}</p>}
                  </li>
                );
              })}
            </ol>
          </Panel>
        </div>

        <aside className="space-y-6">
          {manage && (r.status === "AKTIF" || r.status === "TIDAK_AKTIF") && (
            <Panel title="Status rekod">
              {r.status === "AKTIF" ? (
                <>
                  <p className="mb-3 text-sm text-muted">Rekod tidak dipadam. Penyahaktifan mengekalkan sejarah dan turut menyahaktifkan akaun login penghuni.</p>
                  <ConfirmAction action={setResidentStatusAction} fields={{ id: r.id, to: "TIDAK_AKTIF" }} tone="danger" label="Nyahaktifkan rekod"
                    title={`Nyahaktifkan ${r.fullName}?`} confirmLabel="Nyahaktifkan" note="Sebab (contoh: tamat pengajian, keluar asrama)" noteRequired />
                </>
              ) : (
                <ConfirmAction action={setResidentStatusAction} fields={{ id: r.id, to: "AKTIF" }} tone="ok" label="Aktifkan semula" title="Aktifkan semula rekod ini?" confirmLabel="Aktifkan" note="Catatan (pilihan)" />
              )}
            </Panel>
          )}
          <Panel title="Ketidakhadiran terkini" pad={false}>
            {absences.length === 0 ? <p className="px-5 py-6 text-sm text-muted">Tiada rekod tidak hadir.</p> : (
              <ul className="divide-y divide-line-2">
                {absences.map((a) => (
                  <li key={a.id}>
                    <Link href={`/kehadiran/${a.report.id}`} className="block px-5 py-3 hover:bg-paper">
                      <b>{fmtDate(a.report.date)}</b> <span className="text-sm text-muted">{SESSION_LABEL[a.report.session]}</span>
                      <span className="block text-sm">{a.reason}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
