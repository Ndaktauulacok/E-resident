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

/** Simbol KV dalam lencana putih (untuk latar gelap) */
export function KvspChip({ height = 30 }: { height?: number }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-xl bg-white p-1.5 shadow-[0_6px_16px_-6px_rgba(0,0,0,.45)] ring-1 ring-white/60">
      <KvspMark height={height} />
    </span>
  );
}

/** Persembahan logo beranimasi untuk laman utama */
export function KvspHeroLogo() {
  return (
    <div className="pop relative mx-auto w-fit" style={{ animationDelay: "100ms" }}>
      {/* Cahaya di belakang */}
      <div aria-hidden className="glow absolute -inset-6 rounded-[36px] bg-gradient-to-r from-[#282366]/25 via-[#f15a2b]/30 to-[#ed1c24]/25 blur-2xl" />
      <div className="float relative">
        <div className="shine relative rounded-[28px] bg-white/90 px-6 py-5 shadow-[0_30px_60px_-25px_rgba(40,35,102,.55)] ring-1 ring-white sm:px-10 sm:py-7">
          <KvspLogo width={560} priority className="w-[min(78vw,560px)]" />
        </div>
      </div>
    </div>
  );
}
