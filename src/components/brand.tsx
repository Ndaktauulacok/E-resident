import { useId } from "react";
import clsx from "clsx";

/**
 * Logo KVSP1 bergaya (lencana perisai dengan gelang berputar).
 * Ganti dengan logo rasmi jika ada: letak fail dalam /public dan guna <img>.
 */
export function KvspLogo({ size = 220, animated = true, compact = false, className }: { size?: number; animated?: boolean; compact?: boolean; className?: string }) {
  // Id unik supaya gradien tidak bertembung bila beberapa logo dipaparkan
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (n: string) => `${n}-${u}`;
  return (
    <svg width={size} height={size} viewBox={compact ? "54 36 132 166" : "0 0 240 240"} className={className} role="img" aria-label="Logo KVSP1">
      <defs>
        <linearGradient id={id("kv-main")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ec4899" />
        </linearGradient>
        <linearGradient id={id("kv-warm")} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#fde047" />
          <stop offset="100%" stopColor="#f97316" />
        </linearGradient>
        <linearGradient id={id("kv-shield")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4338ca" />
          <stop offset="100%" stopColor="#7e22ce" />
        </linearGradient>
        <radialGradient id={id("kv-glow")}>
          <stop offset="0%" stopColor="#c084fc" stopOpacity=".9" />
          <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
        </radialGradient>
      </defs>

      {!compact && <circle cx="120" cy="120" r="115" fill={`url(#${id("kv-glow")})`} className={clsx(animated && "glow")} />}

      {/* Gelang luar berputar */}
      <g className={clsx(animated && "spin-slow")}>
        <circle cx="120" cy="120" r="104" fill="none" stroke={`url(#${id("kv-main")})`} strokeWidth="3" strokeDasharray="6 10" strokeLinecap="round" />
        {[0, 90, 180, 270].map((a) => (
          <circle key={a} cx={120 + 104 * Math.cos((a * Math.PI) / 180)} cy={120 + 104 * Math.sin((a * Math.PI) / 180)} r="5" fill={`url(#${id("kv-warm")})`} />
        ))}
      </g>
      <g className={clsx(animated && "spin-rev")}>
        <circle cx="120" cy="120" r="92" fill="none" stroke="#a78bfa" strokeOpacity=".5" strokeWidth="1.5" strokeDasharray="2 6" />
      </g>

      {/* Perisai */}
      <path d="M120 40 L178 62 V118 C178 158 152 184 120 198 C88 184 62 158 62 118 V62 Z" fill={`url(#${id("kv-shield")})`} stroke={`url(#${id("kv-warm")})`} strokeWidth="4" strokeLinejoin="round" />
      <path d="M120 52 L168 70 V118 C168 151 147 173 120 186 C93 173 72 151 72 118 V70 Z" fill="none" stroke="#fff" strokeOpacity=".25" strokeWidth="1.5" className={clsx(animated && "draw")} />

      {/* Bintang */}
      <path d="M120 64 l4.2 8.6 9.5 1.4 -6.9 6.7 1.6 9.4 -8.4 -4.4 -8.4 4.4 1.6 -9.4 -6.9 -6.7 9.5 -1.4z" fill={`url(#${id("kv-warm")})`} />

      {/* Teks */}
      <text x="120" y="132" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="44" fill="#fff" letterSpacing="1">KVSP</text>
      <text x="120" y="172" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="38" fill={`url(#${id("kv-warm")})`}>1</text>
    </svg>
  );
}

/** Lencana kecil untuk sidebar / navbar */
export function KvspMark({ size = 38 }: { size?: number }) {
  return <KvspLogo size={size} animated={false} compact />;
}
