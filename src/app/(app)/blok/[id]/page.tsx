import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { blockScopeOf, can, getScope, requirePage } from "@/lib/auth";
import { PageHeader, Panel } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { assignLeadersAction, saveBlockAction, saveDormAction, setBlockWardensAction } from "../actions";
import { BlockFields, DormFields } from "../fields";

export const metadata = { title: "Blok" };

export default async function BlockPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePage("blocks.view");
  const { id } = await params;
  const b = await db.block.findUnique({
    where: { id },
    include: {
      head: { select: { id: true, name: true, phone: true } },
      assistant: { select: { id: true, name: true, phone: true } },
      wardens: { include: { warden: { select: { id: true, name: true } } } },
      dorms: {
        orderBy: { code: "asc" },
        include: { head: { select: { name: true } }, assistant: { select: { name: true } }, _count: { select: { residents: { where: { status: "AKTIF" } } } } },
      },
    },
  });
  if (!b) notFound();
  const scope = await getScope(user);
  if (!blockScopeOf(scope, b.id)) redirect("/tiada-akses");
  const manage = can(user, "blocks.manage");
  const [heads, assts, wardens] = manage
    ? await Promise.all([
        db.user.findMany({ where: { status: "ACTIVE", role: { key: "KETUA_BLOK" } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        db.user.findMany({ where: { status: "ACTIVE", role: { key: "PEN_KETUA_BLOK" } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
        db.user.findMany({ where: { status: "ACTIVE", role: { key: "WARDEN" } }, select: { id: true, name: true }, orderBy: { name: "asc" } }),
      ])
    : [[], [], []];
  const assigned = new Set(b.wardens.map((w) => w.warden.id));

  return (
    <>
      <PageHeader
        title={`Blok ${b.code}, ${b.name}`}
        desc={`Asrama ${b.gender === "LELAKI" ? "lelaki" : "perempuan"}${b.description ? `. ${b.description}` : ""}`}
        back={{ href: "/blok", label: "Blok & dorm" }}
      />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title={`Dorm (${b.dorms.length})`} pad={false}>
            <div className="overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Dorm</th><th>Aras</th><th>Penghunian</th><th>Ketua Dorm</th><th>Penolong</th><th></th></tr></thead>
                <tbody>
                  {b.dorms.map((d) => {
                    const pct = Math.round((d._count.residents / d.capacity) * 100);
                    return (
                      <tr key={d.id} className={d.isActive ? "" : "opacity-55"}>
                        <td><span className="font-display text-lg font-semibold">{d.code}</span>{!d.isActive && <span className="ml-2 text-xs text-muted">tidak aktif</span>}</td>
                        <td>{d.floor}</td>
                        <td className="min-w-36">
                          <span className="text-sm font-semibold">{d._count.residents}/{d.capacity}</span>
                          <div className="mt-1 h-1.5 w-28 overflow-hidden rounded-full bg-line-2"><div className={`h-full ${pct >= 100 ? "bg-danger" : "bg-ink-3"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                        </td>
                        <td className="text-sm">{d.head?.name ?? <span className="text-danger">Belum ditetapkan</span>}</td>
                        <td className="text-sm">{d.assistant?.name ?? <span className="text-faint">Tiada</span>}</td>
                        <td className="text-right"><Link className="link" href={`/dorm/${d.id}`}>Buka</Link></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Panel>
          {manage && (
            <>
              <Panel title="Tambah dorm">
                <ActionForm action={saveDormAction} resetOnSuccess>
                  <input type="hidden" name="blockId" value={b.id} />
                  <DormFields />
                  <div className="mt-5 flex justify-end"><SubmitButton>Tambah dorm</SubmitButton></div>
                </ActionForm>
              </Panel>
              <details className="panel">
                <summary className="cursor-pointer px-5 py-3.5 font-display text-[1.2rem] font-semibold">Edit maklumat blok</summary>
                <div className="border-t border-line p-5">
                  <ActionForm action={saveBlockAction}>
                    <input type="hidden" name="id" value={b.id} />
                    <BlockFields b={b} edit />
                    <div className="mt-5 flex justify-end"><SubmitButton>Simpan</SubmitButton></div>
                  </ActionForm>
                </div>
              </details>
            </>
          )}
        </div>

        <aside className="space-y-6">
          <Panel title="Kepimpinan blok">
            {manage ? (
              <ActionForm action={assignLeadersAction} className="space-y-4">
                <input type="hidden" name="kind" value="block" />
                <input type="hidden" name="id" value={b.id} />
                <div>
                  <label className="field-label" htmlFor="kb">Ketua Blok</label>
                  <select id="kb" name="headUserId" className="input" defaultValue={b.head?.id ?? ""}>
                    <option value="">Tiada</option>
                    {heads.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="field-label" htmlFor="pkb">Penolong Ketua Blok</label>
                  <select id="pkb" name="assistantUserId" className="input" defaultValue={b.assistant?.id ?? ""}>
                    <option value="">Tiada</option>
                    {assts.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
                  </select>
                  <p className="field-hint">Senarai hanya memaparkan akaun dengan role yang sepadan.</p>
                </div>
                <SubmitButton className="btn btn-primary w-full">Simpan kepimpinan</SubmitButton>
              </ActionForm>
            ) : (
              <dl className="space-y-3 text-sm">
                <div><dt className="text-muted">Ketua Blok</dt><dd className="font-semibold">{b.head?.name ?? "Belum ditetapkan"}</dd></div>
                <div><dt className="text-muted">Penolong Ketua Blok</dt><dd className="font-semibold">{b.assistant?.name ?? "Tiada"}</dd></div>
              </dl>
            )}
          </Panel>
          <Panel title="Warden bertanggungjawab">
            {manage ? (
              <ActionForm action={setBlockWardensAction} className="space-y-2">
                <input type="hidden" name="blockId" value={b.id} />
                {wardens.map((w) => (
                  <label key={w.id} className="flex items-center gap-2.5 py-1">
                    <input type="checkbox" name="wardens" value={w.id} defaultChecked={assigned.has(w.id)} className="size-4 accent-[#172036]" /> {w.name}
                  </label>
                ))}
                <p className="field-hint pb-2">Warden hanya boleh melihat dan menyemak data blok yang ditetapkan kepada mereka.</p>
                <SubmitButton className="btn btn-primary w-full">Simpan</SubmitButton>
              </ActionForm>
            ) : (
              <ul className="space-y-1 text-sm">{b.wardens.map((w) => <li key={w.warden.id} className="font-semibold">{w.warden.name}</li>)}</ul>
            )}
          </Panel>
        </aside>
      </div>
    </>
  );
}
