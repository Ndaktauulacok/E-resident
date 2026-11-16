import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { KvspLogo, KvspMark, ON_DARK } from "./brand";
import { HostelCartoon } from "./cartoon";

type Variant = "user" | "admin";

/** Latar dan susun atur bersama untuk halaman log masuk, daftar & portal admin */
export function AuthShell({
  variant = "user",
  institution,
  heading,
  lead,
  points,
  children,
}: {
  variant?: Variant;
  institution: string;
  heading: React.ReactNode;
  lead: string;
  points: { icon: React.ReactNode; text: string }[];
  children: React.ReactNode;
}) {
  const admin = variant === "admin";
  return (
    <main className={clsx("relative min-h-dvh overflow-hidden", admin && "bg-[#0f0d2b]")}>
      {/* Gumpalan warna beranimasi */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {admin ? (
          <>
            <div className="blob absolute -left-24 top-10 size-[28rem] rounded-full bg-[#f59e0b]/30" />
            <div className="blob absolute -right-20 bottom-0 size-[30rem] rounded-full bg-[#c2410c]/40" style={{ animationDelay: "-6s" }} />
            <div className="blob absolute left-1/3 top-1/2 size-[20rem] rounded-full bg-[#e11d48]/25" style={{ animationDelay: "-11s" }} />
          </>
        ) : (
          <>
            <div className="blob absolute -left-24 -top-10 size-[30rem] rounded-full bg-[#6f68b3]/45" />
            <div className="blob absolute -right-24 top-1/3 size-[28rem] rounded-full bg-[#f7764a]/40" style={{ animationDelay: "-5s" }} />
            <div className="blob absolute bottom-[-8rem] left-1/3 size-[26rem] rounded-full bg-[#fbbf24]/30" style={{ animationDelay: "-10s" }} />
          </>
        )}
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-6xl flex-col px-4 py-6 sm:px-6">
        <Link href="/" className={clsx("inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors", admin ? "text-white/70 hover:bg-white/10 hover:text-white" : "text-ink-3 hover:bg-white/70")}>
          <ArrowLeft size={16} /> Laman utama
        </Link>

        <div className="my-auto grid items-center gap-10 py-8 lg:grid-cols-[1.05fr_1fr]">
          {/* Panel kiri: identiti */}
          <section className={clsx("fade-up hidden lg:block", admin ? "text-white" : "text-ink")}>
            <div className="float w-fit">
              <KvspLogo width={360} className={admin ? ON_DARK : "drop-shadow-[0_12px_18px_rgba(40,35,102,.2)]"} />
            </div>
            <p className={clsx("mt-6 font-display text-2xl font-bold tracking-wide", admin ? "text-amber-300" : "text-grad")}>E-RESIDENT</p>
            <h1 className="mt-2 font-display text-[3.4rem] font-bold leading-[0.98]">{heading}</h1>
            <p className={clsx("mt-5 max-w-md text-[1.05rem]", admin ? "text-white/70" : "text-muted")}>{lead}</p>
            <ul className="mt-8 space-y-3">
              {points.map((p, i) => (
                <li key={i} className="fade-up flex items-center gap-3" style={{ animationDelay: `${200 + i * 120}ms` }}>
                  <span className={clsx("flex size-10 items-center justify-center rounded-xl text-white shadow-lg", admin ? "bg-gradient-to-br from-amber-400 to-orange-500" : ["bg-gradient-to-br from-navy-500 to-navy-700", "bg-gradient-to-br from-flame-500 to-crimson-500", "bg-gradient-to-br from-navy-400 to-navy-600"][i % 3])}>
                    {p.icon}
                  </span>
                  <span className={clsx("font-medium", admin ? "text-white/85" : "text-ink-2")}>{p.text}</span>
                </li>
              ))}
            </ul>
            {!admin && (
              <div className="mt-8 w-[300px] overflow-hidden rounded-[28px] bg-white/70 p-1.5 shadow-[0_20px_40px_-20px_rgba(40,35,102,.5)] ring-1 ring-white">
                <HostelCartoon />
              </div>
            )}
          </section>

          {/* Kad borang */}
          <section className="fade-up mx-auto w-full max-w-md" style={{ animationDelay: "120ms" }}>
            <div className={clsx("relative rounded-[24px] p-[1.5px] shadow-[0_30px_60px_-25px_rgba(40,35,102,.55)]", admin ? "bg-gradient-to-br from-amber-400 via-orange-500 to-crimson-600" : "bg-gradient-to-br from-navy-400 via-flame-400 to-flame-400")}>
              <div className={clsx("rounded-[23px] px-6 py-8 sm:px-9", admin ? "bg-[#16133b] text-white" : "bg-white/95 backdrop-blur")}>
                <div className="mb-6 flex items-center gap-3 lg:hidden">
                  <KvspMark height={40} className={admin ? ON_DARK : undefined} />
                  <div>
                    <p className={clsx("font-display text-2xl font-bold", admin ? "text-white" : "text-grad")}>E-RESIDENT</p>
                    <p className={clsx("text-xs", admin ? "text-white/60" : "text-muted")}>{institution}</p>
                  </div>
                </div>
                {children}
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
