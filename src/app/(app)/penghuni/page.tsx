import Link from "next/link";
import type { Prisma, ResidentStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { can, dormFilter, getScope, requirePage } from "@/lib/auth";
import { fmtDate } from "@/lib/dates";
import { RESIDENT_STATUS } from "@/lib/labels";
import { Badge, EmptyState, PAGE_SIZE, PageHeader, Pagination, pageOf } from "@/components/ui";

export const metadata = { title: "Penghuni" };

export default async function ResidentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const user = await requirePage("residents.view");
  const scope = await getScope(user);
  const sp = await searchParams;
  const page = pageOf(sp);
  const q = (sp.q ?? "").trim().slice(0, 80);

  const dorms = await db.dorm.findMany({ where: dormFilter(scope), include: { block: true }, orderBy: { code: "asc" } });
  const blocks = [...new Map(dorms.map((d) => [d.block.id, d.block])).values()];
  const status = sp.status && sp.status in RESIDENT_STATUS ? (sp.status as ResidentStatus) : undefined;

  const where: Prisma.ResidentWhereInput = {
    dorm: { ...dormFilter(scope), ...(sp.blok ? { blockId: sp.blok } : {}) },
    ...(sp.dorm ? { dormId: sp.dorm } : {}),
    ...(status ? { status } : { status: { not: "DITOLAK" } }),
    ...(q ? { OR: [{ fullName: { contains: q } }, { matricNo: { contains: q } }] } : {}),
  };
  const [total, rows] = await Promise.all([
    db.resident.count({ where }),
    db.resident.findMany({ where, include: { dorm: { include: { block: true } }, user: { select: { status: true } } }, orderBy: [{ dorm: { code: "asc" } }, { fullName: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  const canAdd = can(user, "residents.register") || can(user, "residents.manage");

  return (
    <>
      <PageHeader
        title="Penghuni"
        desc={scope.all ? "Semua penghuni asrama." : "Penghuni dalam bidang kuasa anda."}
        actions={canAdd && <Link href="/penghuni/baru" className="btn btn-tag">Daftar penghuni</Link>}
      />
      <form method="get" className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        <input name="q" defaultValue={q} className="input" placeholder="Nama atau no. matrik" aria-label="Carian" />
        <select name="blok" defaultValue={sp.blok ?? ""} className="input" aria-label="Blok">
          <option value="">Semua blok</option>
          {blocks.map((b) => <option key={b.id} value={b.id}>Blok {b.code}, {b.name}</option>)}
        </select>
        <select name="dorm" defaultValue={sp.dorm ?? ""} className="input" aria-label="Dorm">
          <option value="">Semua dorm</option>
          {dorms.map((d) => <option key={d.id} value={d.id}>{d.code}</option>)}
        </select>
        <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Status">
          <option value="">Semua status</option>
          {Object.entries(RESIDENT_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
        <div className="flex gap-2"><button className="btn btn-primary">Cari</button><Link href="/penghuni" className="btn btn-ghost">Set semula</Link></div>
      </form>

      <div className="panel overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState title={q ? `Tiada penghuni sepadan dengan "${q}"` : "Tiada penghuni untuk penapis ini"} desc="Semak ejaan atau tukar penapis." action={canAdd ? <Link href="/penghuni/baru" className="btn btn-primary">Daftar penghuni</Link> : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Nama</th><th>No. matrik</th><th>Dorm</th><th>Status</th><th>Akaun</th><th>Tarikh daftar</th><th></th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="font-semibold">{r.fullName}</td>
                    <td className="text-muted">{r.matricNo}</td>
                    <td className="whitespace-nowrap"><span className="font-display text-[1.05rem] font-semibold">{r.dorm.code}</span> <span className="text-sm text-muted">{r.dorm.block.name}</span></td>
                    <td><Badge tone={RESIDENT_STATUS[r.status].tone}>{RESIDENT_STATUS[r.status].label}</Badge></td>
                    <td className="text-sm">{r.user ? (r.user.status === "ACTIVE" ? "Aktif" : r.user.status === "PENDING_ACTIVATION" ? "Belum diaktifkan" : "Dinyahaktifkan") : <span className="text-faint">Tiada</span>}</td>
                    <td className="whitespace-nowrap text-sm">{fmtDate(r.registeredAt)}</td>
                    <td className="text-right"><Link className="link" href={`/penghuni/${r.id}`}>Buka</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total} params={sp} basePath="/penghuni" />
      </div>
    </>
  );
}
