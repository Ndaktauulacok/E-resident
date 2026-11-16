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

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const inst = await db.systemSetting.findUnique({ where: { key: "institution.name" } });
  const institution = String(inst?.value ?? "");

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
      </AuthShell>
      <Suspense>
        <Toaster />
      </Suspense>
    </>
  );
}
