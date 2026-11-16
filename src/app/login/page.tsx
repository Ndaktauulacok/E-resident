import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { ClipboardCheck, BellRing, ShieldCheck } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { LoginForm } from "./form";
import { Toaster } from "@/components/shell";
import { AuthShell } from "@/components/auth-shell";

export const metadata = { title: "Log masuk" };
export const dynamic = "force-dynamic";

// Akaun demo (admin tidak disenaraikan di sini — ia ada portal tersendiri)
const DEMO = [
  ["ketuawarden", "Ketua Warden*"], ["warden1", "Warden"], ["ketuaasrama", "Ketua Asrama"],
  ["kb.a", "Ketua Blok A"], ["pkb.a", "Pen. Ketua Blok A"], ["kd.a101", "Ketua Dorm A-101"], ["pkd.a101", "Pen. Ketua Dorm"], ["pelajar", "Penghuni"],
];

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const inst = await db.systemSetting.findUnique({ where: { key: "institution.name" } });
  const institution = String(inst?.value ?? "");
  const showDemo = process.env.NODE_ENV !== "production" || process.env.SHOW_DEMO_LOGINS === "1";

  return (
    <>
      <AuthShell
        institution={institution}
        heading={<>Selamat kembali ke <span className="text-grad-anim">asrama digital</span> anda.</>}
        lead="Log masuk untuk melihat maklumat bilik, jadual Warden bertugas, pengumuman dan laporan kehadiran."
        points={[
          { icon: <ClipboardCheck size={20} />, text: "Kehadiran pagi & malam secara digital" },
          { icon: <BellRing size={20} />, text: "Notifikasi terus dari Warden" },
          { icon: <ShieldCheck size={20} />, text: "Akaun anda dilindungi & selamat" },
        ]}
      >
        <p className="inline-flex items-center gap-2 rounded-full bg-sign-soft px-3 py-1 text-xs font-bold uppercase tracking-wider text-sign">Pelajar & Staf Asrama</p>
        <h2 className="mt-3 font-display text-[2.4rem] font-bold leading-none">Log masuk</h2>
        <p className="mb-7 mt-2 text-muted">
          Pelajar: guna <b className="text-ink">no. IC</b> sebagai nama pengguna dan <b className="text-ink">4 digit terakhir IC</b> sebagai kata laluan.
        </p>
        <LoginForm />
        <p className="mt-6 text-center text-sm text-muted">
          Belum ada akaun?{" "}
          <Link href="/daftar" className="link">Daftar sebagai pelajar</Link>
        </p>
        {showDemo && (
          <details className="mt-6 rounded-xl border border-dashed border-[#c4b5fd] bg-sign-soft/40 px-4 py-3 text-sm">
            <summary className="cursor-pointer font-semibold">Akaun demo (data contoh)</summary>
            <p className="mt-2 text-muted">Kata laluan semua akaun: <b className="text-ink">Demo@1234</b></p>
            <ul className="mt-2 grid grid-cols-1 gap-y-1 sm:grid-cols-2 sm:gap-x-4">
              {DEMO.map(([u, r]) => (
                <li key={u}><code className="font-semibold text-ink">{u}</code> <span className="text-muted">{r}</span></li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted">* Akses penuh: log masuk melalui Portal Admin.</p>
          </details>
        )}
      </AuthShell>
      <Suspense>
        <Toaster />
      </Suspense>
    </>
  );
}
