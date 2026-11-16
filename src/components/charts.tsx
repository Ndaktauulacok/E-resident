"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const PAGI = "#C77A06";
const MALAM = "#2F5BD3";

export type RatePoint = { label: string; pagi: number | null; malam: number | null };

/** Kadar kehadiran 7 hari (pagi & malam). Paksi tunggal dalam peratus. */
export function AttendanceRateChart({ data }: { data: RatePoint[] }) {
  const vals = data.flatMap((d) => [d.pagi, d.malam]).filter((v): v is number => v != null);
  const min = vals.length ? Math.max(0, Math.floor((Math.min(...vals) - 3) / 5) * 5) : 80;
  return (
    <div>
      <ul className="mb-3 flex gap-5 text-sm" aria-label="Petunjuk">
        <li className="flex items-center gap-2"><span className="h-0.5 w-5 rounded" style={{ background: PAGI }} />Pagi</li>
        <li className="flex items-center gap-2"><span className="h-0.5 w-5 rounded" style={{ background: MALAM }} />Malam</li>
      </ul>
      <div className="h-60" role="img" aria-label="Carta kadar kehadiran pagi dan malam bagi tujuh hari terakhir">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="#e8ebf1" vertical={false} />
            <XAxis dataKey="label" tickLine={false} axisLine={{ stroke: "#d9dee7" }} tick={{ fill: "#5f6880", fontSize: 12 }} />
            <YAxis domain={[min, 100]} tickLine={false} axisLine={false} tick={{ fill: "#5f6880", fontSize: 12 }} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              cursor={{ stroke: "#8b93a7", strokeDasharray: "3 3" }}
              contentStyle={{ borderRadius: 8, border: "1px solid #d9dee7", fontFamily: "Barlow", fontSize: 13 }}
              formatter={(v, n) => [v == null ? "Tiada data" : `${Number(v).toFixed(1)}%`, n === "pagi" ? "Pagi" : "Malam"]}
            />
            <Line type="monotone" dataKey="pagi" stroke={PAGI} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
            <Line type="monotone" dataKey="malam" stroke={MALAM} strokeWidth={2} dot={{ r: 4, strokeWidth: 2, fill: "#fff" }} activeDot={{ r: 5 }} connectNulls isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
