import Link from "next/link";
import { getScope, requirePage } from "@/lib/auth";
import { getQueue } from "@/lib/queue";
import { fmtDateTime } from "@/lib/dates";
import { Badge, EmptyState, PageHeader } from "@/components/ui";

export const metadata = { title: "Semakan & pengesahan" };

const KINDS = ["Semua", "Kehadiran", "Pendaftaran"] as const;

export default async function ApprovalsPage({ searchParams }: { searchParams: Promise<{ jenis?: string }> }) {
  const user = await requirePage("approvals.view");
  const scope = await getScope(user);
  const sp = await searchParams;
  const all = await getQueue(user, scope);
  const kind = KINDS.includes(sp.jenis as (typeof KINDS)[number]) ? sp.jenis : "Semua";
  const items = kind === "Semua" ? all : all.filter((i) => i.kind === kind);

  return (
    <>
      <PageHeader
        title="Semakan & pengesahan"
        desc="Semua laporan dan permohonan yang menunggu tindakan anda, disusun mengikut yang paling lama menunggu."
      />
      <nav className="mb-4 flex flex-wrap gap-2" aria-label="Jenis">
        {KINDS.map((k) => {
          const n = k === "Semua" ? all.length : all.filter((i) => i.kind === k).length;
          return (
            <Link key={k} href={k === "Semua" ? "/semakan" : `/semakan?jenis=${k}`} aria-current={kind === k ? "page" : undefined}
              className={`btn btn-sm ${kind === k ? "btn-primary" : "btn-ghost"}`}>
              {k} <span className={kind === k ? "text-tag" : "text-muted"}>{n}</span>
            </Link>
          );
        })}
      </nav>
      <p className="mb-6 text-sm text-muted">Pemeriksaan kebersihan, aduan dan laporan disiplin akan muncul di sini apabila modul tersebut diaktifkan dalam fasa seterusnya.</p>

      <div className="panel overflow-hidden">
        {items.length === 0 ? (
          <EmptyState title="Semua sudah disemak" desc="Tiada item menunggu tindakan anda buat masa ini." />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Jenis</th><th>Perkara</th><th>Lokasi</th><th>Status</th><th>Pelapor</th><th>Dihantar</th><th>Tindakan seterusnya</th><th></th></tr></thead>
              <tbody>
                {items.map((q) => (
                  <tr key={q.kind + q.id}>
                    <td><Badge tone={q.kind === "Kehadiran" ? "ink" : "neutral"}>{q.kind}</Badge></td>
                    <td className="font-semibold">{q.title}</td>
                    <td className="whitespace-nowrap text-sm">{q.place}</td>
                    <td><Badge tone={q.tone}>{q.statusLabel}</Badge></td>
                    <td className="whitespace-nowrap text-sm">{q.by}</td>
                    <td className="whitespace-nowrap text-sm text-muted">{fmtDateTime(q.when)}</td>
                    <td className="whitespace-nowrap text-sm">{q.next}</td>
                    <td className="text-right"><Link href={q.href} className="btn btn-ghost btn-sm">Semak</Link></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
