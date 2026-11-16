import Link from "next/link";
import clsx from "clsx";
import { ArrowLeft } from "lucide-react";
import { KvspLogo } from "./brand";

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
    <main className={clsx("relative min-h-dvh overflow-hidden", admin && "bg-[#0f0b24]")}>
      {/* Gumpalan warna beranimasi */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        {admin ? (
          <>
            <div className="blob absolute -left-24 top-10 size-[28rem] rounded-full bg-[#f59e0b]/30" />
            <div className="blob absolute -right-20 bottom-0 size-[30rem] rounded-full bg-[#7c3aed]/40" style={{ animationDelay: "-6s" }} />
            <div className="blob absolute left-1/3 top-1/2 size-[20rem] rounded-full bg-[#e11d48]/25" style={{ animationDelay: "-11s" }} />
          </>
        ) : (
          <>
            <div className="blob absolute -left-24 -top-10 size-[30rem] rounded-full bg-[#818cf8]/45" />
            <div className="blob absolute -right-24 top-1/3 size-[28rem] rounded-full bg-[#f472b6]/40" style={{ animationDelay: "-5s" }} />
            <div className="blob absolute bottom-[-8rem] left-1/3 size-[26rem] rounded-full bg-[#22d3ee]/35" style={{ animationDelay: "-10s" }} />
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
            <div className="flex items-center gap-4">
              <KvspLogo size={96} className="float" />
              <div>
                <p className={clsx("font-display text-3xl font-bold tracking-wide", admin ? "text-white" : "text-grad")}>E-RESIDENT</p>
                <p className={clsx("text-sm", admin ? "text-white/60" : "text-muted")}>{institution}</p>
              </div>
            </div>
            <h1 className="mt-10 font-display text-[3.4rem] font-bold leading-[0.98]">{heading}</h1>
            <p className={clsx("mt-5 max-w-md text-[1.05rem]", admin ? "text-white/70" : "text-muted")}>{lead}</p>
            <ul className="mt-8 space-y-3">
              {points.map((p, i) => (
                <li key={i} className="fade-up flex items-center gap-3" style={{ animationDelay: `${200 + i * 120}ms` }}>
                  <span className={clsx("flex size-10 items-center justify-center rounded-xl text-white shadow-lg", admin ? "bg-gradient-to-br from-amber-400 to-orange-500" : ["bg-gradient-to-br from-indigo-500 to-violet-500", "bg-gradient-to-br from-pink-500 to-rose-500", "bg-gradient-to-br from-cyan-500 to-sky-500"][i % 3])}>
                    {p.icon}
                  </span>
                  <span className={clsx("font-medium", admin ? "text-white/85" : "text-ink-2")}>{p.text}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* Kad borang */}
          <section className="fade-up mx-auto w-full max-w-md" style={{ animationDelay: "120ms" }}>
            <div className={clsx("relative rounded-[24px] p-[1.5px] shadow-[0_30px_60px_-25px_rgba(124,58,237,.55)]", admin ? "bg-gradient-to-br from-amber-400 via-orange-500 to-rose-600" : "bg-gradient-to-br from-indigo-400 via-fuchsia-400 to-pink-400")}>
              <div className={clsx("rounded-[23px] px-6 py-8 sm:px-9", admin ? "bg-[#17112f] text-white" : "bg-white/95 backdrop-blur")}>
                <div className="mb-6 flex items-center gap-3 lg:hidden">
                  <KvspLogo size={56} />
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
