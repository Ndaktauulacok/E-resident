import { redirect } from "next/navigation";
import { ShieldCheck, Users, ScrollText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { AuthShell } from "@/components/auth-shell";
import { AdminLoginForm } from "./form";

export const metadata = { title: "Portal Admin" };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (await getCurrentUser()) redirect("/dashboard");
  const inst = await db.systemSetting.findUnique({ where: { key: "institution.name" } });
  const institution = String(inst?.value ?? "");

  return (
    <AuthShell
      variant="admin"
      institution={institution}
      heading={<>Portal <span className="bg-gradient-to-r from-amber-300 via-orange-400 to-crimson-400 bg-clip-text text-transparent">Pentadbir</span></>}
      lead="Kawalan penuh sistem asrama: pelajar berdaftar, akaun & role, blok dan dorm, kehadiran serta audit log."
      points={[
        { icon: <Users size={20} />, text: "Pantau semua pelajar yang mendaftar" },
        { icon: <ShieldCheck size={20} />, text: "Urus akaun, role & kebenaran" },
        { icon: <ScrollText size={20} />, text: "Jejak setiap tindakan dalam audit log" },
      ]}
    >
      <p className="inline-flex items-center gap-2 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-amber-300">
        <ShieldCheck size={14} /> Akses terhad
      </p>
      <h2 className="mt-3 font-display text-[2.4rem] font-bold leading-none">Log masuk Admin</h2>
      <p className="mb-7 mt-2 text-white/60">Hanya untuk pentadbir sistem. Semua cubaan log masuk direkodkan.</p>
      <AdminLoginForm />
    </AuthShell>
  );
}
