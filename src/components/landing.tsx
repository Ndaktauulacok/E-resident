"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  ArrowRight, ShieldCheck, LogIn, UserPlus, ClipboardCheck, RadioTower, CalendarClock, BellRing, Building2, Users, Sparkles, ChevronDown, GraduationCap,
} from "lucide-react";
import { KvspHeroLogo, KvspMark } from "./brand";
import { HostelCartoon } from "./cartoon";

type Props = {
  institution: string;
  signedIn: { name: string } | null;
  stats: { residents: number; dorms: number; blocks: number };
};

/** Tambah kelas .is-visible bila elemen .reveal masuk ke skrin */
function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll<HTMLElement>(".reveal");
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && (e.target.classList.add("is-visible"), io.unobserve(e.target))),
      { threshold: 0.15 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);
}

/** Nombor yang mengira naik bila kelihatan */
function CountUp({ to }: { to: number }) {
  const [n, setN] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const start = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - start) / 1400);
        setN(Math.round(to * (1 - Math.pow(1 - p, 3))));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n}</span>;
}

const FEATURES = [
  { icon: ClipboardCheck, title: "Kehadiran Digital", desc: "Ketua Dorm hantar laporan pagi & malam terus dari telefon.", grad: "from-indigo-500 to-violet-500" },
  { icon: RadioTower, title: "Pemantauan Langsung", desc: "Warden nampak status setiap dorm secara masa nyata.", grad: "from-pink-500 to-rose-500" },
  { icon: CalendarClock, title: "Jadual Warden", desc: "Semak siapa Warden bertugas hari ini dan minggu ini.", grad: "from-amber-400 to-orange-500" },
  { icon: BellRing, title: "Notifikasi Pantas", desc: "Makluman terus bila laporan disemak atau perlu pembetulan.", grad: "from-cyan-500 to-sky-500" },
  { icon: Building2, title: "Blok & Dorm", desc: "Maklumat bilik, kapasiti dan ketua dorm tersusun kemas.", grad: "from-emerald-500 to-teal-500" },
  { icon: ShieldCheck, title: "Selamat & Teraudit", desc: "Setiap tindakan direkod dalam audit log yang tidak boleh diubah.", grad: "from-fuchsia-500 to-purple-600" },
];

const PLATES = ["A-101", "A-102", "A-201", "A-202", "B-101", "B-102", "B-201", "B-202", "C-101", "C-102", "C-201", "C-202"];

export function Landing({ institution, signedIn, stats }: Props) {
  useReveal();
  const [started, setStarted] = useState(false);
  const accessRef = useRef<HTMLDivElement>(null);

  const getStarted = () => {
    setStarted(true);
    requestAnimationFrame(() => accessRef.current?.scrollIntoView({ behavior: "smooth", block: "center" }));
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* ── Navbar ── */}
      <header className="fixed inset-x-0 top-0 z-40">
        <div className="mx-auto mt-3 flex max-w-6xl items-center justify-between gap-3 rounded-2xl px-4 py-2.5 glass shadow-[0_10px_30px_-15px_rgba(79,70,229,.35)] sm:mx-4 lg:mx-auto">
          <Link href="/" className="flex items-center gap-2.5">
            <KvspMark height={36} />
            <span className="leading-tight">
              <span className="block font-display text-xl font-bold text-grad">E-RESIDENT</span>
              <span className="hidden text-[0.72rem] text-muted sm:block">{institution}</span>
            </span>
          </Link>
          {/* Butang admin — berasingan daripada pengguna biasa */}
          <Link href="/admin-login" className="group inline-flex items-center gap-2 rounded-xl bg-[#17112f] px-3.5 py-2 text-sm font-semibold text-amber-300 shadow-lg ring-1 ring-amber-400/30 transition hover:-translate-y-0.5 hover:ring-amber-400/70">
            <ShieldCheck size={16} className="transition group-hover:rotate-12" />
            <span>Portal Admin</span>
          </Link>
        </div>
      </header>

      {/* ── Hero ── */}
      <section className="relative flex min-h-dvh items-center justify-center px-4 pb-16 pt-28">
        <div aria-hidden className="pointer-events-none absolute inset-0">
          <div className="blob absolute -left-32 top-10 size-[34rem] rounded-full bg-[#818cf8]/50" />
          <div className="blob absolute -right-32 top-24 size-[30rem] rounded-full bg-[#f472b6]/45" style={{ animationDelay: "-5s" }} />
          <div className="blob absolute bottom-0 left-1/3 size-[28rem] rounded-full bg-[#fbbf24]/35" style={{ animationDelay: "-9s" }} />
          {/* Bintang berkelip */}
          {Array.from({ length: 18 }).map((_, i) => (
            <span
              key={i}
              className={clsx("twinkle absolute size-1.5 rounded-full", ["bg-violet-400 shadow-[0_0_10px_2px_rgba(167,139,250,.8)]", "bg-pink-400 shadow-[0_0_10px_2px_rgba(244,114,182,.8)]", "bg-amber-300 shadow-[0_0_10px_2px_rgba(252,211,77,.8)]"][i % 3])}
              style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 90}%`, animationDelay: `${(i % 6) * 0.5}s` }}
            />
          ))}
        </div>

        <div className="relative mx-auto w-full max-w-6xl">
          <KvspHeroLogo />

          <div className="mt-10 grid items-center gap-10 lg:grid-cols-[1.05fr_1fr]">
            <div className="text-center lg:text-left">
              <p className="fade-up inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-sign shadow-sm ring-1 ring-violet-200" style={{ animationDelay: "350ms" }}>
                <Sparkles size={15} className="text-pink" /> Sistem Pengurusan Asrama Digital
              </p>
              <h1 className="fade-up mt-5 font-display text-[3rem] font-bold leading-[0.95] sm:text-[4.4rem]" style={{ animationDelay: "500ms" }}>
                Selamat Datang ke <br />
                <span className="text-grad-anim">E-RESIDENT KVSP1</span>
              </h1>
              <p className="fade-up mx-auto mt-5 max-w-xl text-lg text-muted lg:mx-0" style={{ animationDelay: "650ms" }}>
                Asrama {institution} kini lebih teratur. Kehadiran, pendaftaran dan makluman Warden, semuanya di hujung jari.
              </p>
              <div className="fade-up mt-9 flex flex-col items-center gap-3 lg:items-start" style={{ animationDelay: "800ms" }}>
                {signedIn ? (
                  <Link href="/dashboard" className="btn btn-primary shine !h-14 !rounded-2xl !px-8 text-lg">
                    Teruskan sebagai {signedIn.name.split(" ")[0]} <ArrowRight size={20} />
                  </Link>
                ) : (
                  <button onClick={getStarted} className="btn btn-primary shine group !h-14 !rounded-2xl !px-9 text-lg">
                    Get Started <ArrowRight size={20} className="transition group-hover:translate-x-1" />
                  </button>
                )}
                <a href="#ciri" className="mt-4 inline-flex flex-col items-center text-sm font-medium text-muted hover:text-sign">
                  Terokai ciri-ciri <ChevronDown size={18} className="float" />
                </a>
              </div>
            </div>

            {/* Kartun beranimasi */}
            <div className="fade-up relative mx-auto w-full max-w-[520px]" style={{ animationDelay: "600ms" }}>
              <div aria-hidden className="glow absolute -inset-4 rounded-[44px] bg-gradient-to-br from-indigo-400/40 via-pink-400/30 to-amber-300/40 blur-2xl" />
              <div className="relative rounded-[36px] bg-white/70 p-2 shadow-[0_30px_60px_-25px_rgba(124,58,237,.55)] ring-1 ring-white">
                <HostelCartoon />
              </div>
            </div>
          </div>

          <div className="mx-auto max-w-3xl">
          {/* ── Pilihan masuk (muncul selepas Get Started) ── */}
          <div ref={accessRef} className={clsx("grid transition-all duration-700 ease-out", started ? "mt-6 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")}>
            <div className="-mx-8 overflow-hidden">
              <div className="grid gap-4 px-8 pb-14 pt-2 sm:grid-cols-2">
                <AccessCard
                  href="/login"
                  icon={<LogIn size={26} />}
                  title="Log Masuk"
                  desc="Pelajar & staf asrama yang sudah ada akaun."
                  grad="from-indigo-500 via-violet-500 to-purple-600"
                  delay={0}
                  show={started}
                />
                <AccessCard
                  href="/daftar"
                  icon={<UserPlus size={26} />}
                  title="Daftar Pelajar"
                  desc="Daftar akaun baharu dengan no. IC anda."
                  grad="from-pink-500 via-rose-500 to-orange-400"
                  delay={120}
                  show={started}
                />
              </div>
            </div>
          </div>
          </div>
        </div>
      </section>

      {/* ── Jalur papan dorm bergerak ── */}
      <section aria-hidden className="relative -rotate-1 overflow-hidden bg-ink py-4 shadow-xl">
        <div className="marquee flex w-max gap-3">
          {[...PLATES, ...PLATES, ...PLATES, ...PLATES].map((c, i) => (
            <span key={i} className="flex items-center gap-2 rounded-lg border border-white/15 bg-white/10 px-4 py-2 font-display text-xl font-bold tracking-wide text-white/90">
              <span className={clsx("size-2 rounded-full", ["bg-emerald-400", "bg-amber-300", "bg-pink-400", "bg-cyan-300"][i % 4])} />
              {c}
            </span>
          ))}
        </div>
      </section>

      {/* ── Statistik ── */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid gap-5 sm:grid-cols-3">
          {[
            { label: "Penghuni aktif", value: stats.residents, icon: Users, grad: "from-indigo-500 to-violet-500" },
            { label: "Dorm", value: stats.dorms, icon: Building2, grad: "from-pink-500 to-rose-500" },
            { label: "Blok asrama", value: stats.blocks, icon: GraduationCap, grad: "from-amber-400 to-orange-500" },
          ].map((s, i) => (
            <div key={s.label} className="reveal panel lift flex items-center gap-5 p-6" style={{ transitionDelay: `${i * 120}ms` }}>
              <span className={clsx("flex size-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", s.grad)}>
                <s.icon size={30} />
              </span>
              <div>
                <p className="font-display text-5xl font-bold leading-none text-grad"><CountUp to={s.value} /></p>
                <p className="mt-1 font-medium text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Ciri-ciri ── */}
      <section id="ciri" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24">
        <div className="reveal mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-[.2em] text-pink">Ciri-ciri utama</p>
          <h2 className="mt-2 font-display text-5xl font-bold">Semua urusan asrama, <span className="text-grad">satu tempat</span></h2>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f, i) => (
            <article key={f.title} className="reveal panel lift group p-6" style={{ transitionDelay: `${(i % 3) * 100}ms` }}>
              <span className={clsx("flex size-14 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110", f.grad)}>
                <f.icon size={26} />
              </span>
              <h3 className="mt-5 font-display text-2xl font-bold">{f.title}</h3>
              <p className="mt-1.5 text-muted">{f.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* ── Seruan akhir ── */}
      <section className="px-4 pb-20">
        <div className="reveal relative mx-auto max-w-5xl overflow-hidden rounded-[28px] bg-ink px-6 py-14 text-center text-white shadow-[0_30px_60px_-25px_rgba(124,58,237,.6)] sm:px-12">
          <div aria-hidden className="blob absolute -right-16 -top-16 size-72 rounded-full bg-pink-500/40" />
          <div aria-hidden className="blob absolute -bottom-20 -left-10 size-72 rounded-full bg-cyan-400/30" style={{ animationDelay: "-7s" }} />
          <div className="relative">
            <h2 className="font-display text-4xl font-bold sm:text-5xl">Sedia untuk bermula?</h2>
            <p className="mx-auto mt-3 max-w-lg text-white/75">Pelajar baharu boleh mendaftar sekarang menggunakan no. IC. Akaun aktif serta-merta.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Link href="/daftar" className="btn btn-tag shine !h-12 !rounded-xl !px-6 text-base"><UserPlus size={18} /> Daftar pelajar</Link>
              <Link href="/login" className="btn !h-12 !rounded-xl border-white/30 bg-white/10 !px-6 text-base text-white hover:bg-white/20"><LogIn size={18} /> Log masuk</Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line/70 px-4 py-8 text-center text-sm text-muted">
        <p>© {new Date().getFullYear()} E-RESIDENT · {institution}</p>
      </footer>
    </div>
  );
}

function AccessCard({ href, icon, title, desc, grad, delay, show }: { href: string; icon: React.ReactNode; title: string; desc: string; grad: string; delay: number; show: boolean }) {
  return (
    <Link
      href={href}
      tabIndex={show ? 0 : -1}
      className={clsx(
        "group relative overflow-hidden rounded-3xl bg-gradient-to-br p-6 text-left text-white shadow-[0_20px_40px_-20px_rgba(124,58,237,.7)] transition-all duration-500 hover:-translate-y-1.5 hover:shadow-[0_30px_50px_-20px_rgba(124,58,237,.8)]",
        grad,
        show ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0",
      )}
      style={{ transitionDelay: show ? `${delay}ms` : "0ms" }}
    >
      <span aria-hidden className="absolute -right-8 -top-8 size-32 rounded-full bg-white/15 transition-transform duration-500 group-hover:scale-150" />
      <span className="relative flex size-14 items-center justify-center rounded-2xl bg-white/20 ring-1 ring-white/40 backdrop-blur">{icon}</span>
      <span className="relative mt-4 block font-display text-3xl font-bold">{title}</span>
      <span className="relative mt-1 block text-white/85">{desc}</span>
      <span className="relative mt-4 inline-flex items-center gap-1.5 font-semibold">
        Teruskan <ArrowRight size={18} className="transition group-hover:translate-x-1.5" />
      </span>
    </Link>
  );
}
