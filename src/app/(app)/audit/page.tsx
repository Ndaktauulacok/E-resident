import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth";
import { dateOnly, fmtDateTime } from "@/lib/dates";
import { EmptyState, PAGE_SIZE, PageHeader, Pagination, pageOf } from "@/components/ui";

export const metadata = { title: "Audit log" };

export default async function AuditPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePage("audit.view");
  const sp = await searchParams;
  const page = pageOf(sp);
  const q = (sp.q ?? "").trim().slice(0, 80);
  const valid = (d?: string) => !!d && /^\d{4}-\d{2}-\d{2}$/.test(d);
  const to = valid(sp.hingga) ? new Date(dateOnly(sp.hingga!).getTime() + 86400_000 - 8 * 3600_000) : undefined;
  const from = valid(sp.dari) ? new Date(dateOnly(sp.dari!).getTime() - 8 * 3600_000) : undefined;
  const where: Prisma.AuditLogWhereInput = {
    ...(q ? { OR: [{ summary: { contains: q } }, { user: { name: { contains: q } } }, { user: { username: { contains: q } } }] } : {}),
    ...(sp.tindakan ? { action: sp.tindakan } : {}),
    ...(from || to ? { createdAt: { ...(from ? { gte: from } : {}), ...(to ? { lt: to } : {}) } } : {}),
  };
  const [total, rows, actions] = await Promise.all([
    db.auditLog.count({ where }),
    db.auditLog.findMany({ where, include: { user: { select: { name: true, username: true } } }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE * 2, take: PAGE_SIZE * 2 }),
    db.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
  ]);

  return (
    <>
      <PageHeader title="Audit log" desc="Rekod kekal bagi aktiviti penting dalam sistem. Log ini hanya boleh dibaca; tiada sesiapa boleh mengubah atau memadamnya melalui aplikasi." />
      <form method="get" className="panel mb-4 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr_auto]">
        <input name="q" defaultValue={q} className="input" placeholder="Cari pengguna atau keterangan" aria-label="Carian" />
        <select name="tindakan" defaultValue={sp.tindakan ?? ""} className="input" aria-label="Tindakan">
          <option value="">Semua tindakan</option>
          {actions.map((a) => <option key={a.action} value={a.action}>{a.action.replaceAll("_", " ").toLowerCase()}</option>)}
        </select>
        <input type="date" name="dari" defaultValue={sp.dari} className="input" aria-label="Dari tarikh" />
        <input type="date" name="hingga" defaultValue={sp.hingga} className="input" aria-label="Hingga tarikh" />
        <div className="flex gap-2"><button className="btn btn-primary">Tapis</button><Link href="/audit" className="btn btn-ghost">Set semula</Link></div>
      </form>
      <div className="panel overflow-hidden">
        {rows.length === 0 ? <EmptyState title="Tiada rekod untuk penapis ini" /> : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Masa</th><th>Pengguna</th><th>Tindakan</th><th>Keterangan</th><th>IP</th></tr></thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="whitespace-nowrap text-sm">{fmtDateTime(r.createdAt)}</td>
                    <td className="whitespace-nowrap text-sm">{r.user ? <><b>{r.user.name}</b><span className="block text-muted">{r.user.username}</span></> : <span className="text-muted">Tidak diketahui</span>}</td>
                    <td className="whitespace-nowrap"><code className="rounded bg-paper px-1.5 py-0.5 text-[0.78rem] font-semibold text-ink-3">{r.action}</code></td>
                    <td className="text-sm">{r.summary}</td>
                    <td className="whitespace-nowrap text-sm text-muted">{r.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={Math.ceil(total / (PAGE_SIZE * 2))} total={total} params={sp} basePath="/audit" />
      </div>
    </>
  );
}
