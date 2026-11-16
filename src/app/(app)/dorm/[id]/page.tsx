import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, getScope, inScope, requireUser } from "@/lib/auth";
import { RESIDENT_STATUS } from "@/lib/labels";
import { Badge, EmptyState, PageHeader, Panel } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { assignLeadersAction, saveDormAction } from "../../blok/actions";
import { DormFields } from "../../blok/fields";

export const metadata = { title: "Dorm" };

export default async function DormPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!can(user, "residents.view") && !can(user, "blocks.view")) redirect("/tiada-akses");
  const { id } = await params;
  const d = await db.dorm.findUnique({
    where: { id },
    include: {
      block: true,
      head: { select: { id: true, name: true } },
      assistant: { select: { id: true, name: true } },
      residents: { where: { status: { in: ["AKTIF", "MENUNGGU_PENDAFTARAN"] } }, orderBy: { fullName: "asc" } },
    },
  });
  if (!d) notFound();
  const scope = await getScope(user);
  if (!inScope(scope, d.id)) redirect("/tiada-akses");
  const manage = can(user, "blocks.manage");
  const [heads, assts] = manage
    ? await Promise.all([
        db.user.findMany({ where: { status: "ACTIVE", role: { key: "KETUA_DORM" } }, select: { id: true, name: true, resident: { select: { dorm: { select: { code: true } } } } }, orderBy: { name: "asc" } }),
        db.user.findMany({ where: { status: "ACTIVE", role: { key: "PEN_KETUA_DORM" } }, select: { id: true, name: true, resident: { select: { dorm: { select: { code: true } } } } }, orderBy: { name: "asc" } }),
      ])
    : [[], []];
  const active = d.residents.filter((r) => r.status === "AKTIF").length;
  const showLinks = can(user, "residents.view");

  return (
    <>
      <PageHeader
        title={`Dorm ${d.code}`}
        desc={`Blok ${d.block.code} ${d.block.name}, aras ${d.floor}. ${active} penghuni aktif daripada kapasiti ${d.capacity}.`}
        back={can(user, "blocks.view") ? { href: `/blok/${d.blockId}`, label: `Blok ${d.block.code}` } : { href: "/dashboard", label: "Dashboard" }}
        actions={can(user, "attendance.submit") && <Link href={`/kehadiran/hantar?dorm=${d.id}`} className="btn btn-tag">Hantar laporan kehadiran</Link>}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <Panel title="Senarai penghuni" pad={false}>
          {d.residents.length === 0 ? <EmptyState title="Dorm ini kosong" /> : (
            <ul className="divide-y divide-line-2">
              {d.residents.map((r, i) => (
                <li key={r.id} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-6 text-right font-display text-lg text-faint">{i + 1}</span>
                  <div className="min-w-0 flex-1">
                    {showLinks ? <Link href={`/penghuni/${r.id}`} className="font-semibold hover:underline">{r.fullName}</Link> : <b>{r.fullName}</b>}
                    <p className="text-sm text-muted">{r.matricNo}{r.id && (d.head?.id && r.userId === d.head.id ? ", Ketua Dorm" : d.assistant?.id && r.userId === d.assistant.id ? ", Penolong Ketua Dorm" : "")}</p>
                  </div>
                  {r.status !== "AKTIF" && <Badge tone={RESIDENT_STATUS[r.status].tone}>{RESIDENT_STATUS[r.status].label}</Badge>}
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <aside className="space-y-6">
          <Panel title="Kepimpinan dorm">
            {manage ? (
              <ActionForm action={assignLeadersAction} className="space-y-4">
                <input type="hidden" name="kind" value="dorm" />
                <input type="hidden" name="id" value={d.id} />
                <div>
                  <label className="field-label" htmlFor="kd">Ketua Dorm</label>
                  <select id="kd" name="headUserId" className="input" defaultValue={d.head?.id ?? ""}>
                    <option value="">Tiada</option>
                    {heads.map((u) => <option key={u.id} value={u.id}>{u.name}{u.resident ? ` (${u.resident.dorm.code})` : ""}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="pkd">Penolong Ketua Dorm</label>
                  <select id="pkd" name="assistantUserId" className="input" defaultValue={d.assistant?.id ?? ""}>
                    <option value="">Tiada</option>
                    {assts.map((u) => <option key={u.id} value={u.id}>{u.name}{u.resident ? ` (${u.resident.dorm.code})` : ""}</option>)}
                  </select>
                </div>
                <SubmitButton className="btn btn-primary w-full">Simpan kepimpinan</SubmitButton>
              </ActionForm>
            ) : (
              <dl className="space-y-3 text-sm">
                <div><dt className="text-muted">Ketua Dorm</dt><dd className="font-semibold">{d.head?.name ?? "Belum ditetapkan"}</dd></div>
                <div><dt className="text-muted">Penolong Ketua Dorm</dt><dd className="font-semibold">{d.assistant?.name ?? "Tiada"}</dd></div>
              </dl>
            )}
          </Panel>
          {manage && (
            <Panel title="Tetapan dorm">
              <ActionForm action={saveDormAction}>
                <input type="hidden" name="id" value={d.id} />
                <DormFields d={d} edit />
                <SubmitButton className="btn btn-primary mt-4 w-full">Simpan</SubmitButton>
              </ActionForm>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
