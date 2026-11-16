import Link from "next/link";
import { redirect } from "next/navigation";
import { UserPlus, IdCard, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthShell } from "@/components/auth-shell";
import { SignupForm } from "./form";

export const metadata = { title: "Daftar Pelajar" };
export const dynamic = "force-dynamic";

export default async function SignupPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const inst = await db.systemSetting.findUnique({ where: { key: "institution.name" } });
  const institution = String(inst?.value ?? "");

  return (
    <AuthShell
      institution={institution}
      heading={<>Sertai <span className="text-grad-anim">E-RESIDENT</span> dalam masa kurang seminit.</>}
      lead="Daftar akaun pelajar menggunakan no. kad pengenalan anda. Tiada kata laluan untuk diingat."
      points={[
        { icon: <IdCard size={20} />, text: "Nama pengguna: no. IC penuh (12 digit)" },
        { icon: <Sparkles size={20} />, text: "Kata laluan: 4 digit terakhir IC" },
        { icon: <UserPlus size={20} />, text: "Akaun aktif serta-merta selepas daftar" },
      ]}
    >
      <p className="inline-flex items-center gap-2 rounded-full bg-flame-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-flame-600">Pelajar baharu</p>
      <h2 className="mt-3 font-display text-[2.4rem] font-bold leading-none">Daftar akaun</h2>
      <p className="mb-6 mt-2 text-muted">Isi maklumat di bawah. Pastikan no. IC betul kerana ia digunakan untuk log masuk.</p>
      <SignupForm />
      <p className="mt-6 text-center text-sm text-muted">
        Sudah ada akaun? <Link href="/login" className="link">Log masuk</Link>
      </p>
    </AuthShell>
  );
}
