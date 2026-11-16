import Link from "next/link";
import clsx from "clsx";
import type { BoardBlock, Cell } from "@/lib/monitor";

type W = "akan" | "buka" | "tutup";

/** Warna jalur status pada papan pintu */
export function cellLook(c: Cell, w: W): { bar: string; text: string; label: string; short: string } {
  if (!c) {
    if (w === "tutup") return { bar: "bg-danger", text: "text-danger", label: "Tidak dihantar", short: "Tiada laporan" };
    if (w === "buka") return { bar: "bg-tag", text: "text-[#8a6a00]", label: "Belum hantar", short: "Belum hantar" };
    return { bar: "bg-line", text: "text-faint", label: "Sesi belum dibuka", short: "Belum dibuka" };
  }
  switch (c.status) {
    case "SELESAI": return { bar: "bg-ok", text: "text-ok", label: "Selesai", short: "Selesai" };
    case "PERLU_PEMBETULAN": return { bar: "bg-danger", text: "text-danger", label: "Perlu pembetulan", short: "Pembetulan" };
    case "DRAF": return { bar: "bg-[#b5bccb]", text: "text-muted", label: "Draf", short: "Draf" };
    case "MENUNGGU_WARDEN": return { bar: "bg-sign", text: "text-sign", label: "Menunggu semakan Warden", short: "Semak Warden" };
    default: return { bar: "bg-sign", text: "text-sign", label: "Menunggu semakan Ketua Blok", short: "Semak K. Blok" };
  }
}

export const LEGEND = [
  ["bg-ok", "Selesai"], ["bg-sign", "Menunggu semakan"], ["bg-tag", "Belum hantar"], ["bg-danger", "Tidak dihantar / perlu pembetulan"], ["bg-line", "Sesi belum dibuka"],
];

function Half({ label, c, w }: { label: string; c: Cell; w: W }) {
  const look = cellLook(c, w);
  const inner = (
    <>
      <span className={clsx("block h-1.5 rounded-full", look.bar)} aria-hidden />
      <span className="mt-2 flex items-baseline justify-between gap-1">
        <span className="text-[0.78rem] font-medium text-muted">{label}</span>
        {c ? (
          <span className="font-display text-[1.05rem] font-semibold">
            {c.present}/{c.registered}
          </span>
        ) : (
          <span className="font-display text-[1.05rem] font-semibold text-faint">—</span>
        )}
      </span>
      <span className={clsx("block truncate text-[0.74rem] font-semibold", look.text)} title={look.label}>{look.short}</span>
      <span className="block min-h-[1.1rem] text-[0.72rem] font-medium text-danger">{c && c.absent > 0 ? `${c.absent} tidak hadir` : ""}</span>
    </>
  );
  return c ? (
    <Link href={`/kehadiran/${c.id}`} className="block rounded-[4px] p-2 hover:bg-paper" aria-label={`${label}: ${look.label}`}>{inner}</Link>
  ) : (
    <div className="p-2">{inner}</div>
  );
}

export function DormBoard({ blocks, wPagi, wMalam }: { blocks: BoardBlock[]; wPagi: W; wMalam: W }) {
  let n = 0;
  return (
    <div className="space-y-8">
      {blocks.map((b) => (
        <section key={b.id}>
          <div className="mb-3 flex items-baseline gap-3">
            <h2 className="font-display text-[1.6rem] font-bold">Blok {b.code}</h2>
            <span className="text-muted">{b.name}, {b.dorms.length} dorm</span>
          </div>
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {b.dorms.map((d) => (
              <article key={d.id} className="plate plate-in" style={{ animationDelay: `${n++ * 30}ms` }}>
                <div className="flex items-start justify-between bg-ink px-3 pb-2.5 pt-3 text-white">
                  <Link href={`/dorm/${d.id}`} className="plate-code text-[1.9rem] hover:text-tag">{d.code}</Link>
                  <span className="mt-1 rounded-[3px] bg-white/10 px-1.5 text-[0.72rem] font-semibold text-white/75" title="Penghuni aktif">{d.residents} org</span>
                </div>
                <div className="grid grid-cols-2 divide-x divide-line-2">
                  <Half label="Pagi" c={d.pagi} w={wPagi} />
                  <Half label="Malam" c={d.malam} w={wMalam} />
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
