import Link from "next/link";
import { getScope, requirePage } from "@/lib/auth";
import { addDays, fmtDate, fmtTime, todayISO } from "@/lib/dates";
import { getBoard, sessionWindows, windowState } from "@/lib/monitor";
import { DormBoard, LEGEND } from "@/components/board";
import { AutoRefresh } from "@/components/shell";
import { EmptyState, PageHeader, Panel } from "@/components/ui";

export const metadata = { title: "Pemantauan langsung" };

export default async function MonitorPage({ searchParams }: { searchParams: Promise<{ tarikh?: string }> }) {
  const user = await requirePage("monitoring.view");
  const scope = await getScope(user);
  const sp = await searchParams;
  const today = todayISO();
  const iso = sp.tarikh && /^\d{4}-\d{2}-\d{2}$/.test(sp.tarikh) && sp.tarikh <= today ? sp.tarikh : today;
  const [board, win] = await Promise.all([getBoard(scope, iso), sessionWindows()]);
  const wPagi = windowState(iso, win.PAGI);
  const wMalam = windowState(iso, win.MALAM);

  const dorms = board.flatMap((b) => b.dorms.map((d) => ({ ...d, block: b })));
  const sent = (s: "pagi" | "malam") => dorms.filter((d) => d[s] && d[s]!.status !== "DRAF").length;
  const latest = (d: (typeof dorms)[number]) => (wMalam !== "akan" ? d.malam ?? null : d.pagi ?? null);
  const present = dorms.reduce((a, d) => a + (latest(d)?.present ?? 0), 0);
  const absent = dorms.reduce((a, d) => a + (latest(d)?.absent ?? 0), 0);
  const waiting = dorms.flatMap((d) => (["pagi", "malam"] as const).filter((s) => d[s] && ["MENUNGGU_KETUA_BLOK", "MENUNGGU_WARDEN"].includes(d[s]!.status)).map((s) => ({ d, s, c: d[s]! })));
  const missing = dorms.flatMap((d) =>
    (["pagi", "malam"] as const).filter((s) => (s === "pagi" ? wPagi : wMalam) !== "akan" && (!d[s] || d[s]!.status === "DRAF")).map((s) => ({ d, s })),
  );
  const focusSession = wMalam !== "akan" ? "malam" : "pagi";

  return (
    <>
      {iso === today && <AutoRefresh seconds={30} />}
      <PageHeader
        title="Pemantauan langsung"
        desc={
          <span className="inline-flex flex-wrap items-center gap-2">
            {iso === today ? (
              <><span className="live-dot size-2 rounded-full bg-ok" aria-hidden /> Dikemas kini setiap 30 saat, terakhir {fmtTime(new Date())}</>
            ) : (
              <>Rekod bagi {fmtDate(iso, true)}</>
            )}
          </span>
        }
        actions={
          <form method="get" className="flex items-center gap-2">
            <Link className="btn btn-ghost btn-sm" href={`/pemantauan?tarikh=${addDays(iso, -1)}`} aria-label="Hari sebelumnya">‹</Link>
            <input type="date" name="tarikh" defaultValue={iso} max={today} className="input !h-8 !w-40 text-sm" aria-label="Tarikh" />
            <button className="btn btn-ghost btn-sm">Lihat</button>
            {iso !== today && <Link className="btn btn-primary btn-sm" href="/pemantauan">Hari ini</Link>}
          </form>
        }
      />

      {dorms.length === 0 ? (
        <div className="panel"><EmptyState title="Tiada dorm dalam bidang kuasa anda" desc="Minta Admin menetapkan blok atau dorm kepada akaun anda." /></div>
      ) : (
        <>
          <section className="panel mb-8 grid grid-cols-2 divide-line md:grid-cols-5 md:divide-x">
            {[
              ["Pagi dihantar", `${sent("pagi")}/${dorms.length}`, `Tutup ${win.PAGI.close}`],
              ["Malam dihantar", `${sent("malam")}/${dorms.length}`, `Dibuka ${win.MALAM.open}`],
              [`Hadir (sesi ${focusSession})`, present, "Daripada laporan yang dihantar"],
              [`Tidak hadir (sesi ${focusSession})`, absent, absent ? "Lihat butiran dalam laporan" : "Tiada"],
              ["Menunggu semakan", waiting.length, "Ketua Blok dan Warden"],
            ].map(([l, v, s]) => (
              <div key={l as string} className="border-b border-line px-5 py-4 md:border-b-0">
                <p className="text-sm font-medium text-muted">{l}</p>
                <p className="mt-1 font-display text-[2.3rem] font-bold leading-none">{v}</p>
                <p className="mt-1.5 text-[0.8rem] text-muted">{s}</p>
              </div>
            ))}
          </section>

          <ul className="mb-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted" aria-label="Petunjuk warna">
            {LEGEND.map(([c, l]) => <li key={l} className="flex items-center gap-2"><span className={`h-1.5 w-5 rounded-full ${c}`} />{l}</li>)}
          </ul>

          <DormBoard blocks={board} wPagi={wPagi} wMalam={wMalam} />

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <Panel title={`Belum menghantar (${missing.length})`} pad={false}>
              {missing.length === 0 ? <p className="px-5 py-6 text-muted">Semua dorm telah menghantar bagi sesi yang telah dibuka.</p> : (
                <ul className="divide-y divide-line-2">
                  {missing.map(({ d, s }) => (
                    <li key={d.id + s} className="flex items-center justify-between px-5 py-2.5">
                      <span><b className="font-display text-lg">{d.code}</b> <span className="text-sm text-muted">Blok {d.block.name}</span></span>
                      <span className="text-sm">Sesi {s}{d[s]?.status === "DRAF" && <span className="text-muted">, masih draf</span>}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
            <Panel title={`Menunggu semakan (${waiting.length})`} pad={false}>
              {waiting.length === 0 ? <p className="px-5 py-6 text-muted">Tiada laporan menunggu semakan.</p> : (
                <ul className="divide-y divide-line-2">
                  {waiting.map(({ d, s, c }) => (
                    <li key={c.id}>
                      <Link href={`/kehadiran/${c.id}`} className="flex items-center justify-between px-5 py-2.5 hover:bg-paper">
                        <span><b className="font-display text-lg">{d.code}</b> <span className="text-sm text-muted">sesi {s}</span></span>
                        <span className="text-sm text-sign">{c.status === "MENUNGGU_WARDEN" ? "Warden" : "Ketua Blok"}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </>
      )}
    </>
  );
}
