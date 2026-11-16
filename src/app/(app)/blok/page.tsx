import Link from "next/link";
import { db } from "@/lib/db";
import { can, getScope, requirePage } from "@/lib/auth";
import { EmptyState, PageHeader, Panel } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { saveBlockAction } from "./actions";
import { BlockFields } from "./fields";

export const metadata = { title: "Blok & dorm" };

export default async function BlocksPage() {
  const user = await requirePage("blocks.view");
  const scope = await getScope(user);
  const blocks = await db.block.findMany({
    where: scope.all ? {} : { id: { in: scope.blockIds } },
    orderBy: { code: "asc" },
    include: {
      head: { select: { name: true } },
      wardens: { include: { warden: { select: { name: true } } } },
      dorms: { include: { _count: { select: { residents: { where: { status: "AKTIF" } } } } } },
    },
  });
  const manage = can(user, "blocks.manage");

  return (
    <>
      <PageHeader title="Blok & dorm" desc="Struktur fizikal asrama, kapasiti dan kepimpinan setiap blok." />
      {blocks.length === 0 ? (
        <div className="panel"><EmptyState title="Belum ada blok" desc={manage ? "Tambah blok pertama di bawah." : "Anda belum ditetapkan kepada mana-mana blok."} /></div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {blocks.map((b) => {
            const cap = b.dorms.filter((d) => d.isActive).reduce((a, d) => a + d.capacity, 0);
            const occ = b.dorms.reduce((a, d) => a + d._count.residents, 0);
            const pct = cap ? Math.round((occ / cap) * 100) : 0;
            return (
              <Link key={b.id} href={`/blok/${b.id}`} className={`plate block transition-colors hover:border-ink-3 ${!b.isActive ? "opacity-60" : ""}`}>
                <div className="flex items-end justify-between bg-ink px-5 pb-4 pt-5 text-white">
                  <div>
                    <p className="text-sm text-white/55">Blok</p>
                    <p className="plate-code text-[4rem]">{b.code}</p>
                  </div>
                  <div className="pb-1 text-right">
                    <p className="font-display text-2xl font-semibold">{b.name}</p>
                    <p className="text-sm text-white/60">Asrama {b.gender === "LELAKI" ? "lelaki" : "perempuan"}{!b.isActive && ", tidak aktif"}</p>
                  </div>
                </div>
                <div className="space-y-3 p-5">
                  <div>
                    <div className="flex justify-between text-sm"><span className="text-muted">Penghunian</span><span className="font-semibold">{occ}/{cap} ({pct}%)</span></div>
                    <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line-2"><div className={`h-full rounded-full ${pct >= 95 ? "bg-danger" : "bg-ink-3"}`} style={{ width: `${Math.min(pct, 100)}%` }} /></div>
                  </div>
                  <p className="text-sm"><span className="text-muted">Dorm:</span> {b.dorms.length}</p>
                  <p className="text-sm"><span className="text-muted">Ketua Blok:</span> {b.head?.name ?? <span className="text-danger">Belum ditetapkan</span>}</p>
                  <p className="text-sm"><span className="text-muted">Warden:</span> {b.wardens.map((w) => w.warden.name).join(", ") || <span className="text-danger">Belum ditetapkan</span>}</p>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {manage && (
        <Panel title="Tambah blok" className="mt-8 max-w-3xl">
          <ActionForm action={saveBlockAction} resetOnSuccess>
            <BlockFields />
            <div className="mt-5 flex justify-end"><SubmitButton>Tambah blok</SubmitButton></div>
          </ActionForm>
        </Panel>
      )}
    </>
  );
}
