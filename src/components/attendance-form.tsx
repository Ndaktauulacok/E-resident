"use client";

import { useState } from "react";
import clsx from "clsx";

export type RosterRow = { id: string; name: string; matric: string; present: boolean; reason: string };

const COMMON = ["Pulang bermalam (outing diluluskan)", "Bilik sakit", "Pertandingan luar", "Kecemasan keluarga", "Program kokurikulum"];

/** Senarai semak kehadiran dengan kiraan langsung. Jumlah sentiasa = berdaftar (dikira semula di server). */
export function AttendanceRoster({ rows: initial }: { rows: RosterRow[] }) {
  const [rows, setRows] = useState(initial);
  const present = rows.filter((r) => r.present).length;
  const set = (id: string, patch: Partial<RosterRow>) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));

  return (
    <div>
      <div className="sticky top-16 z-10 mb-4 grid grid-cols-3 rounded-[8px] border border-line bg-white">
        {[
          ["Berdaftar", rows.length, "text-ink"],
          ["Hadir", present, "text-ok"],
          ["Tidak hadir", rows.length - present, rows.length - present ? "text-danger" : "text-ink"],
        ].map(([l, v, c]) => (
          <div key={l as string} className="border-r border-line px-4 py-3 last:border-0">
            <p className="text-[0.8rem] font-medium text-muted">{l}</p>
            <p className={clsx("font-display text-3xl font-bold leading-none", c as string)} aria-live="polite">{v}</p>
          </div>
        ))}
      </div>

      <datalist id="sebab-lazim">{COMMON.map((c) => <option key={c} value={c} />)}</datalist>
      <ul className="divide-y divide-line-2 rounded-[8px] border border-line bg-white">
        {rows.map((r, i) => (
          <li key={r.id} className={clsx("px-4 py-3", !r.present && "bg-danger-soft/40")}>
            <input type="hidden" name={`p_${r.id}`} value={r.present ? "1" : "0"} />
            <div className="flex flex-wrap items-center gap-3">
              <span className="w-6 text-right font-display text-lg font-semibold text-faint">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{r.name}</p>
                <p className="text-[0.8rem] text-muted">{r.matric}</p>
              </div>
              <div className="flex overflow-hidden rounded-[6px] border border-line" role="radiogroup" aria-label={`Kehadiran ${r.name}`}>
                <button type="button" role="radio" aria-checked={r.present} onClick={() => set(r.id, { present: true })} className={clsx("px-3.5 py-1.5 text-sm font-semibold", r.present ? "bg-ok text-white" : "bg-white text-muted hover:text-ink")}>Hadir</button>
                <button type="button" role="radio" aria-checked={!r.present} onClick={() => set(r.id, { present: false })} className={clsx("border-l border-line px-3.5 py-1.5 text-sm font-semibold", !r.present ? "bg-danger text-white" : "bg-white text-muted hover:text-ink")}>Tidak hadir</button>
              </div>
            </div>
            {!r.present && (
              <div className="mt-2.5 sm:pl-9">
                <label className="sr-only" htmlFor={`r_${r.id}`}>Sebab tidak hadir</label>
                <input id={`r_${r.id}`} name={`r_${r.id}`} list="sebab-lazim" className="input" placeholder="Sebab tidak hadir (wajib)" value={r.reason} onChange={(e) => set(r.id, { reason: e.target.value })} required minLength={3} maxLength={200} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
