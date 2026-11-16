"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import {
  ArrowRight, ShieldCheck, LogIn, UserPlus, ClipboardCheck, RadioTower, CalendarClock, BellRing, Building2, Sparkles, Info, X, ArrowLeft,
} from "lucide-react";
import { KvspLogo, KvspMark } from "./brand";
import { HostelCartoon } from "./cartoon";

type Props = {
  institution: string;
  signedIn: { name: string } | null;
};

const FEATURES = [
  { icon: ClipboardCheck, title: "Kehadiran Digital", desc: "Ketua Dorm hantar laporan pagi & malam terus dari telefon.", grad: "from-navy-500 to-navy-700" },
  { icon: RadioTower, title: "Pemantauan Langsung", desc: "Warden nampak status setiap dorm secara masa nyata.", grad: "from-flame-500 to-crimson-500" },
  { icon: CalendarClock, title: "Jadual Warden", desc: "Semak siapa Warden bertugas hari ini dan minggu ini.", grad: "from-amber-400 to-orange-500" },
  { icon: BellRing, title: "Notifikasi Pantas", desc: "Makluman terus bila laporan disemak atau perlu pembetulan.", grad: "from-navy-400 to-navy-600" },
  { icon: Building2, title: "Blok & Dorm", desc: "Maklumat bilik, kapasiti dan ketua dorm tersusun kemas.", grad: "from-emerald-500 to-teal-500" },
  { icon: ShieldCheck, title: "Selamat & Teraudit", desc: "Setiap tindakan direkod dalam audit log yang tidak boleh diubah.", grad: "from-flame-500 to-navy-800" },
];

export function Landing({ institution, signedIn }: Props) {
  const [started, setStarted] = useState(false);
  const infoRef = useRef<HTMLDialogElement>(null);
  const openInfo = () => infoRef.current?.showModal();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      {/* Latar beranimasi */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="blob absolute -left-32 top-10 size-[34rem] rounded-full bg-[#6f68b3]/40" />
        <div className="blob absolute -right-32 top-24 size-[30rem] rounded-full bg-[#f7764a]/40" style={{ animationDelay: "-5s" }} />
        <div className="blob absolute bottom-0 left-1/3 size-[28rem] rounded-full bg-[#fbbf24]/30" style={{ animationDelay: "-9s" }} />
        {Array.from({ length: 14 }).map((_, i) => (
          <span
            key={i}
            className={clsx("twinkle absolute size-1.5 rounded-full", ["bg-navy-400", "bg-flame-400", "bg-amber-300"][i % 3])}
            style={{ left: `${(i * 53) % 100}%`, top: `${(i * 37) % 85}%`, animationDelay: `${(i % 6) * 0.5}s` }}
          />
        ))}
      </div>

      {/* ── Navbar ── */}
      <header className="relative z-20 px-3 pt-3 sm:px-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 rounded-2xl px-3 py-2 glass shadow-[0_10px_30px_-15px_rgba(40,35,102,.35)] sm:px-4">
          <Link href="/" className="flex min-w-0 items-center gap-2.5">
            <KvspMark height={34} />
            <span className="min-w-0 leading-tight">
              <span className="block font-display text-xl font-bold text-grad">E-RESIDENT</span>
              <span className="hidden truncate text-[0.72rem] text-muted sm:block">{institution}</span>
            </span>
          </Link>
          <div className="flex shrink-0 items-center gap-2">
            <button onClick={openInfo} className="inline-flex items-center gap-1.5 rounded-xl bg-white/80 px-3 py-2 text-sm font-semibold text-ink-2 ring-1 ring-navy-100 transition hover:-translate-y-0.5 hover:text-sign hover:ring-flame-200">
              <Info size={16} /> <span>Info</span>
            </button>
            {/* Butang admin — berasingan daripada pengguna biasa */}
            <Link href="/admin-login" className="group inline-flex items-center gap-1.5 rounded-xl bg-[#16133b] px-3 py-2 text-sm font-semibold text-amber-300 shadow-lg ring-1 ring-amber-400/30 transition hover:-translate-y-0.5 hover:ring-amber-400/70">
              <ShieldCheck size={16} className="transition group-hover:rotate-12" />
              <span className="hidden sm:inline">Portal Admin</span><span className="sm:hidden">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ── Kandungan utama (satu skrin) ── */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-4">
        <div className="pop mx-auto w-fit" style={{ animationDelay: "100ms" }}>
          <div className="float">
            <KvspLogo width={420} priority className="w-[min(80vw,420px)] drop-shadow-[0_14px_20px_rgba(40,35,102,.22)] lg:w-[min(36vw,420px)]" />
          </div>
        </div>

        <div className="mt-5 grid items-center gap-6 lg:mt-8 lg:grid-cols-[1.1fr_1fr] lg:gap-10">
          <div className="text-center lg:text-left">
            <p className="fade-up inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-1.5 text-sm font-semibold text-sign shadow-sm ring-1 ring-flame-100" style={{ animationDelay: "300ms" }}>
              <Sparkles size={15} className="text-pink" /> Sistem Pengurusan Asrama Digital
            </p>
            <h1 className="fade-up mt-4 font-display text-[2.6rem] font-bold leading-[0.95] sm:text-[3.6rem] lg:text-[4rem]" style={{ animationDelay: "450ms" }}>
              Selamat Datang ke <br />
              <span className="text-grad-anim">E-RESIDENT KVSP1</span>
            </h1>
            <p className="fade-up mx-auto mt-3 max-w-lg text-base text-muted sm:text-lg lg:mx-0" style={{ animationDelay: "600ms" }}>
              Kehadiran, pendaftaran dan makluman Warden, semuanya di hujung jari.
            </p>

            {/* Butang Get Started bertukar kepada pilihan masuk di tempat yang sama */}
            <div className="fade-up mt-6 min-h-[8.5rem]" style={{ animationDelay: "750ms" }}>
              {signedIn ? (
                <Link href="/dashboard" className="btn btn-primary shine !h-14 !rounded-2xl !px-8 text-lg">
                  Teruskan sebagai {signedIn.name.split(" ")[0]} <ArrowRight size={20} />
                </Link>
              ) : !started ? (
                <div className="flex flex-col items-center gap-3 lg:items-start">
                  <button onClick={() => setStarted(true)} className="btn btn-primary shine group !h-14 !rounded-2xl !px-9 text-lg">
                    Get Started <ArrowRight size={20} className="transition group-hover:translate-x-1" />
                  </button>
                  <button onClick={openInfo} className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-sign">
                    <Info size={15} /> Apa itu E-RESIDENT?
                  </button>
                </div>
              ) : (
                <div className="mx-auto max-w-xl lg:mx-0">
                  <div className="grid gap-3 sm:grid-cols-2">
                    <AccessCard href="/login" icon={<LogIn size={22} />} title="Log Masuk" desc="Pelajar & staf asrama" grad="from-navy-500 via-navy-600 to-navy-800" delay={0} />
                    <AccessCard href="/daftar" icon={<UserPlus size={22} />} title="Daftar Pelajar" desc="Akaun baharu guna no. IC" grad="from-flame-400 via-flame-500 to-crimson-500" delay={100} />
                  </div>
                  <button onClick={() => setStarted(false)} className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-sign">
                    <ArrowLeft size={15} /> Kembali
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Kartun beranimasi (disembunyikan pada skrin rendah supaya tidak perlu skrol) */}
          <div className="fade-up relative mx-auto hidden w-full max-w-[440px] lg:block" style={{ animationDelay: "550ms" }}>
            <div aria-hidden className="glow absolute -inset-4 rounded-[44px] bg-gradient-to-br from-navy-400/30 via-flame-400/25 to-amber-300/35 blur-2xl" />
            <div className="relative rounded-[36px] bg-white/70 p-2 shadow-[0_30px_60px_-25px_rgba(40,35,102,.55)] ring-1 ring-white">
              <HostelCartoon />
            </div>
          </div>
        </div>
      </main>

      {/* ── Tetingkap Info: ciri-ciri utama ── */}
      <InfoDialog ref={infoRef} institution={institution} />
    </div>
  );
}

function InfoDialog({ ref, institution }: { ref: React.RefObject<HTMLDialogElement | null>; institution: string }) {
  // Tutup bila klik di luar kotak
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    const onClick = (e: MouseEvent) => e.target === d && d.close();
    d.addEventListener("click", onClick);
    return () => d.removeEventListener("click", onClick);
  }, [ref]);

  return (
    <dialog
      ref={ref}
      aria-labelledby="info-title"
      className="m-auto max-h-[88dvh] w-[min(94vw,52rem)] overflow-y-auto rounded-[24px] border-0 bg-white p-0 text-ink shadow-[0_40px_80px_-30px_rgba(22,19,59,.6)] backdrop:bg-[#16133b]/55 backdrop:backdrop-blur-sm"
    >
      <div className="relative overflow-hidden bg-ink px-6 py-6 text-white sm:px-8">
        <div aria-hidden className="blob absolute -right-10 -top-16 size-56 rounded-full bg-flame-500/40" />
        <div className="relative flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-bold uppercase tracking-[.2em] text-amber-300">Ciri-ciri utama</p>
            <h2 id="info-title" className="mt-1 font-display text-3xl font-bold sm:text-4xl">Semua urusan asrama, satu tempat</h2>
            <p className="mt-1 text-sm text-white/70">E-RESIDENT · {institution}</p>
          </div>
          <button onClick={() => ref.current?.close()} className="rounded-full p-2 text-white/80 transition hover:rotate-90 hover:bg-white/15 hover:text-white" aria-label="Tutup">
            <X size={20} />
          </button>
        </div>
      </div>
      <div className="grid gap-4 p-6 sm:grid-cols-2 sm:p-8">
        {FEATURES.map((f, i) => (
          <article key={f.title} className="plate-in group flex gap-4 rounded-2xl border border-line p-4 transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_-18px_rgba(40,35,102,.5)]" style={{ animationDelay: `${i * 60}ms` }}>
            <span className={clsx("flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110", f.grad)}>
              <f.icon size={22} />
            </span>
            <div>
              <h3 className="font-display text-xl font-bold">{f.title}</h3>
              <p className="mt-0.5 text-sm text-muted">{f.desc}</p>
            </div>
          </article>
        ))}
      </div>
    </dialog>
  );
}

function AccessCard({ href, icon, title, desc, grad, delay }: { href: string; icon: React.ReactNode; title: string; desc: string; grad: string; delay: number }) {
  return (
    <Link
      href={href}
      className={clsx(
        "pop group relative flex items-center gap-3.5 overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-left text-white shadow-[0_18px_35px_-18px_rgba(40,35,102,.7)] transition hover:-translate-y-1 hover:shadow-[0_26px_45px_-20px_rgba(40,35,102,.8)]",
        grad,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <span aria-hidden className="absolute -right-6 -top-6 size-20 rounded-full bg-white/15 transition-transform duration-500 group-hover:scale-150" />
      <span className="relative flex size-12 shrink-0 items-center justify-center rounded-xl bg-white/20 ring-1 ring-white/40">{icon}</span>
      <span className="relative min-w-0 flex-1">
        <span className="block font-display text-2xl font-bold leading-tight">{title}</span>
        <span className="block text-sm text-white/85">{desc}</span>
      </span>
      <ArrowRight size={20} className="relative shrink-0 transition group-hover:translate-x-1" />
    </Link>
  );
}
