import { useId } from "react";
import clsx from "clsx";

/**
 * Ilustrasi kartun asrama beranimasi: dua pelajar di hadapan bangunan asrama.
 * SVG + CSS sahaja (tiada imej luaran). Animasi dimatikan jika pengguna memilih "reduce motion".
 */
export function HostelCartoon({ className, sky = true }: { className?: string; sky?: boolean }) {
  const u = useId().replace(/[^a-zA-Z0-9]/g, "");
  const id = (n: string) => `${n}-${u}`;
  const windows = [0, 1, 2].flatMap((r) => [0, 1, 2, 3].map((c) => ({ r, c })));

  return (
    <svg viewBox="0 0 420 330" className={clsx("h-auto w-full", className)} role="img" aria-label="Ilustrasi pelajar di hadapan asrama">
      <defs>
        <linearGradient id={id("sky")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#dedcf0" />
          <stop offset="100%" stopColor="#fff1e8" />
        </linearGradient>
        <linearGradient id={id("wall")} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e9e7fb" />
        </linearGradient>
        <linearGradient id={id("roof")} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#282366" />
          <stop offset="100%" stopColor="#3d3790" />
        </linearGradient>
        <clipPath id={id("clip")}>
          <rect x="0" y="0" width="420" height="330" rx="36" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${id("clip")})`}>
        {sky && <rect width="420" height="330" fill={`url(#${id("sky")})`} />}

        {/* Matahari */}
        <g transform="translate(350 62)">
          <g className="cartoon-spin">
            {Array.from({ length: 10 }).map((_, i) => (
              <rect key={i} x="-2.5" y="-40" width="5" height="12" rx="2.5" fill="#fbbf24" transform={`rotate(${i * 36})`} />
            ))}
          </g>
          <circle r="22" fill="#fcd34d" />
          <circle r="22" fill="#f59e0b" opacity=".25" className="glow" />
        </g>

        {/* Awan bergerak */}
        <g className="cartoon-drift" opacity=".95">
          <Cloud x={40} y={50} s={1} />
        </g>
        <g className="cartoon-drift-slow" opacity=".85">
          <Cloud x={210} y={34} s={0.75} />
        </g>

        {/* Bukit / tanah */}
        <ellipse cx="210" cy="345" rx="300" ry="70" fill="#86efac" />
        <ellipse cx="80" cy="330" rx="160" ry="50" fill="#4ade80" />

        {/* Bangunan asrama */}
        <g>
          <rect x="178" y="118" width="200" height="172" rx="8" fill={`url(#${id("wall")})`} stroke="#282366" strokeWidth="3" />
          <path d="M166 124 L278 72 L390 124 Z" fill={`url(#${id("roof")})`} stroke="#282366" strokeWidth="3" strokeLinejoin="round" />
          <rect x="248" y="88" width="60" height="20" rx="4" fill="#f15a2b" />
          <text x="278" y="102.5" textAnchor="middle" fontFamily="'Barlow Condensed', sans-serif" fontWeight="700" fontSize="13" fill="#fff" letterSpacing="1.5">ASRAMA</text>
          {windows.map(({ r, c }, i) => (
            <rect
              key={i}
              x={194 + c * 46} y={134 + r * 40} width="30" height="26" rx="4"
              fill={(r + c) % 3 === 0 ? "#fde68a" : "#dedcf0"} stroke="#282366" strokeWidth="2.5"
              className={(r + c) % 3 === 0 ? "cartoon-light" : undefined}
              style={{ animationDelay: `${(i % 5) * 0.6}s` }}
            />
          ))}
          <rect x="262" y="250" width="32" height="40" rx="4" fill="#f15a2b" stroke="#282366" strokeWidth="2.5" />
          <circle cx="287" cy="271" r="2.5" fill="#282366" />
        </g>

        {/* Pokok */}
        <g className="cartoon-sway" style={{ transformOrigin: "392px 300px" }}>
          <rect x="388" y="250" width="8" height="45" rx="3" fill="#92400e" />
          <circle cx="392" cy="240" r="22" fill="#22c55e" stroke="#15803d" strokeWidth="2.5" />
        </g>

        {/* Pelajar lelaki melambai */}
        <g className="cartoon-bob">
          <Boy />
        </g>

        {/* Pelajar perempuan bertudung memegang buku */}
        <g className="cartoon-bob" style={{ animationDelay: "-1.2s" }}>
          <Girl />
        </g>

        {/* Hiasan bintang */}
        {[[60, 120], [150, 95], [30, 200]].map(([x, y], i) => (
          <path key={i} d={`M${x} ${y - 7} l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z`} fill={["#f15a2b", "#ed1c24", "#f15a2b"][i]} className="twinkle" style={{ animationDelay: `${i * 0.8}s` }} />
        ))}
      </g>
    </svg>
  );
}

function Cloud({ x, y, s }: { x: number; y: number; s: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill="#fff">
      <ellipse cx="30" cy="20" rx="30" ry="16" />
      <ellipse cx="58" cy="14" rx="24" ry="18" />
      <ellipse cx="80" cy="22" rx="22" ry="13" />
    </g>
  );
}

function Eyes({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g className="cartoon-blink" style={{ transformOrigin: `${cx}px ${cy}px` }}>
      <ellipse cx={cx - 7} cy={cy} rx="2.6" ry="3.4" fill="#1f1b52" />
      <ellipse cx={cx + 7} cy={cy} rx="2.6" ry="3.4" fill="#1f1b52" />
    </g>
  );
}

function Boy() {
  return (
    <g>
      {/* kaki */}
      <rect x="62" y="262" width="11" height="34" rx="5" fill="#282366" />
      <rect x="78" y="262" width="11" height="34" rx="5" fill="#282366" />
      <ellipse cx="66" cy="298" rx="10" ry="5" fill="#1f1b52" />
      <ellipse cx="85" cy="298" rx="10" ry="5" fill="#1f1b52" />
      {/* badan (baju oren kolej) */}
      <rect x="54" y="206" width="44" height="62" rx="16" fill="#f15a2b" stroke="#282366" strokeWidth="2.5" />
      <path d="M68 208 L76 222 L84 208" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinejoin="round" />
      {/* beg galas */}
      <rect x="46" y="214" width="12" height="36" rx="5" fill="#282366" />
      {/* tangan kiri */}
      <rect x="44" y="214" width="11" height="40" rx="5.5" fill="#f5c09a" transform="rotate(10 50 214)" />
      {/* tangan kanan melambai */}
      <g className="cartoon-wave" style={{ transformOrigin: "96px 214px" }}>
        <rect x="92" y="176" width="11" height="42" rx="5.5" fill="#f5c09a" transform="rotate(20 96 214)" />
        <circle cx="108" cy="178" r="8" fill="#f5c09a" />
      </g>
      {/* kepala */}
      <circle cx="76" cy="180" r="27" fill="#f5c09a" stroke="#282366" strokeWidth="2.5" />
      <path d="M50 176 C50 150 102 146 103 174 C95 162 70 160 50 176 Z" fill="#1f1b52" />
      <Eyes cx={76} cy={182} />
      <path d="M68 193 Q76 200 84 193" fill="none" stroke="#1f1b52" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="61" cy="190" r="4" fill="#fb7185" opacity=".55" />
      <circle cx="91" cy="190" r="4" fill="#fb7185" opacity=".55" />
    </g>
  );
}

function Girl() {
  return (
    <g>
      {/* kaki / kain */}
      <path d="M118 262 h40 l6 34 h-52 z" fill="#282366" />
      <ellipse cx="128" cy="298" rx="9" ry="4.5" fill="#1f1b52" />
      <ellipse cx="152" cy="298" rx="9" ry="4.5" fill="#1f1b52" />
      {/* badan */}
      <rect x="114" y="208" width="48" height="60" rx="16" fill="#6f68b3" stroke="#282366" strokeWidth="2.5" />
      {/* buku */}
      <g className="cartoon-book" style={{ transformOrigin: "138px 238px" }}>
        <rect x="122" y="226" width="32" height="24" rx="3" fill="#fbbf24" stroke="#282366" strokeWidth="2.5" />
        <line x1="138" y1="226" x2="138" y2="250" stroke="#282366" strokeWidth="2" />
      </g>
      <rect x="112" y="222" width="12" height="22" rx="6" fill="#f5c09a" />
      <rect x="152" y="222" width="12" height="22" rx="6" fill="#f5c09a" />
      {/* tudung */}
      <path d="M108 186 C108 150 168 150 168 186 L172 222 C152 230 124 230 104 222 Z" fill="#ed1c24" stroke="#282366" strokeWidth="2.5" strokeLinejoin="round" />
      {/* muka */}
      <ellipse cx="138" cy="186" rx="21" ry="23" fill="#f5c09a" />
      <Eyes cx={138} cy={186} />
      <path d="M131 197 Q138 203 145 197" fill="none" stroke="#1f1b52" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="125" cy="194" r="3.5" fill="#fb7185" opacity=".55" />
      <circle cx="151" cy="194" r="3.5" fill="#fb7185" opacity=".55" />
    </g>
  );
}
