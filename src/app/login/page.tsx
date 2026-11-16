import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginForm } from "./form";
import { Toaster } from "@/components/shell";

export const metadata = { title: "Log masuk" };
export const dynamic = "force-dynamic";

// Dinding papan pintu: hiasan identiti (tiada data sebenar dipaparkan sebelum log masuk)
const WALL = ["A-101", "A-102", "A-201", "A-202", "B-101", "B-102", "B-201", "B-202", "C-101", "C-102", "C-201", "C-202"];
const DEMO = [
  ["admin", "Admin"], ["ketuawarden", "Ketua Warden"], ["warden1", "Warden"], ["ketuaasrama", "Ketua Asrama"],
  ["kb.a", "Ketua Blok A"], ["pkb.a", "Pen. Ketua Blok A"], ["kd.a101", "Ketua Dorm A-101"], ["pkd.a101", "Pen. Ketua Dorm"], ["pelajar", "Penghuni"],
];

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const inst = await db.systemSetting.findUnique({ where: { key: "institution.name" } });
  const institution = String(inst?.value ?? "");
  const showDemo = process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_LOGINS === "1";

  return (
    <main className="grid min-h-dvh lg:grid-cols-[1.1fr_1fr]">
      <section className="relative hidden overflow-hidden bg-ink px-12 py-12 text-white lg:flex lg:flex-col">
        <div className="flex items-center gap-3">
          <svg width="40" height="40" viewBox="0 0 32 32" aria-hidden>
            <rect width="32" height="32" rx="6" fill="#263150" />
            <rect x="8" y="6" width="16" height="20" rx="2" fill="none" stroke="#F5C542" strokeWidth="2.4" />
            <circle cx="19.5" cy="17" r="1.7" fill="#F5C542" />
          </svg>
          <div>
            <p className="font-display text-2xl font-bold tracking-wide">E-RESIDENT</p>
            <p className="text-sm text-white/55">{institution}</p>
          </div>
        </div>

        <div className="my-auto max-w-xl py-12">
          <h1 className="font-display text-[3.6rem] font-bold leading-[0.98]">
            Setiap dorm melapor.
            <br />
            Setiap laporan disemak.
          </h1>
          <p className="mt-5 max-w-md text-[1.05rem] text-white/70">
            Kehadiran pagi dan malam, pendaftaran penghuni dan semakan Warden dalam satu sistem untuk seluruh asrama.
          </p>
        </div>

        <div className="grid grid-cols-6 gap-2.5" aria-hidden>
          {WALL.map((c, i) => (
            <div key={c} className="plate-in rounded-[4px] border border-white/10 bg-ink-2 px-3 py-2.5" style={{ animationDelay: `${i * 45}ms` }}>
              <span className={`block h-1 w-6 rounded ${i === 4 ? "bg-tag" : i % 5 === 2 ? "bg-white/25" : "bg-[#3fae7c]"}`} />
              <span className="mt-2 block font-display text-xl font-bold tracking-wide text-white/90">{c}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <div className="mb-10 lg:hidden">
            <p className="font-display text-3xl font-bold">E-RESIDENT</p>
            <p className="text-sm text-muted">{institution}</p>
          </div>
          <h2 className="font-display text-[2.4rem] font-bold">Log masuk</h2>
          <p className="mb-7 mt-1 text-muted">Gunakan akaun yang diberikan oleh pihak asrama.</p>
          <LoginForm />
          {showDemo && (
            <details className="mt-8 rounded-[8px] border border-dashed border-[#c3cad7] bg-white px-4 py-3 text-sm">
              <summary className="cursor-pointer font-semibold">Akaun demo (data contoh)</summary>
              <p className="mt-2 text-muted">
                Kata laluan semua akaun: <b className="text-ink">Demo@1234</b>
              </p>
              <ul className="mt-2 grid grid-cols-1 gap-y-1 sm:grid-cols-2 sm:gap-x-4">
                {DEMO.map(([u, r]) => (
                  <li key={u}>
                    <code className="font-semibold text-ink">{u}</code> <span className="text-muted">{r}</span>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </section>
      <Suspense>
        <Toaster />
      </Suspense>
    </main>
  );
}
