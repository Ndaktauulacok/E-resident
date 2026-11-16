import clsx from "clsx";

const SRC = "/logo-kvsp1.png";
const W = 2400;
const H = 688;
// Kawasan simbol "KV" dalam logo (piksel asal)
const MARK_W = 680;
const MARK_H = 490;

/** Logo rasmi KVSP1 (penuh) */
export function KvspLogo({ width = 320, className, priority }: { width?: number; className?: string; priority?: boolean }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={SRC}
      alt="Kolej Vokasional Sungai Petani 1"
      width={width}
      height={Math.round((width * H) / W)}
      className={clsx("h-auto max-w-full select-none", className)}
      draggable={false}
      fetchPriority={priority ? "high" : undefined}
    />
  );
}

/** Simbol "KV" sahaja, dipotong daripada logo rasmi (untuk sidebar / navbar) */
export function KvspMark({ height = 34, className }: { height?: number; className?: string }) {
  const w = Math.round((height * MARK_W) / MARK_H);
  const imgW = Math.round((height * W) / MARK_H);
  return (
    <span className={clsx("relative inline-block shrink-0 overflow-hidden", className)} style={{ width: w, height }} aria-hidden>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={SRC} alt="" style={{ width: imgW, maxWidth: "none", height: "auto" }} className="absolute left-0 top-0 select-none" draggable={false} />
    </span>
  );
}

/** Versi putih logo untuk latar gelap (tanpa kotak putih) */
export const ON_DARK = "brightness-0 invert drop-shadow-[0_6px_14px_rgba(0,0,0,.35)]";

/** Simbol KV untuk latar gelap (sidebar) */
export function KvspChip({ height = 30 }: { height?: number }) {
  return <KvspMark height={height} className={ON_DARK} />;
}

/** Persembahan logo beranimasi untuk laman utama */
export function KvspHeroLogo() {
  return (
    <div className="pop relative mx-auto w-fit" style={{ animationDelay: "100ms" }}>
      {/* Cahaya di belakang */}
      <div aria-hidden className="glow absolute -inset-6 rounded-full bg-gradient-to-r from-white/60 via-[#f15a2b]/15 to-white/60 blur-3xl" />
      <div className="float relative">
        <KvspLogo width={560} priority className="w-[min(86vw,560px)] drop-shadow-[0_18px_25px_rgba(40,35,102,.25)]" />
      </div>
    </div>
  );
}
