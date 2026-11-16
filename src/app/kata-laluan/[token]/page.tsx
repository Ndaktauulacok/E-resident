import Link from "next/link";
import { findValidToken } from "@/lib/account";
import { SetPasswordForm } from "./form";

export const metadata = { title: "Tetapkan kata laluan" };
export const dynamic = "force-dynamic";

export default async function SetPasswordPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await findValidToken(token);

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-12">
      <div className="w-full max-w-md">
        <p className="font-display text-2xl font-bold">E-RESIDENT</p>
        {!t ? (
          <div className="panel mt-6 p-7">
            <h1 className="font-display text-3xl font-bold">Pautan ini tidak lagi sah</h1>
            <p className="mt-2 text-muted">
              Pautan mungkin telah digunakan, telah tamat tempoh, atau telah digantikan dengan pautan baharu. Minta Warden menjana pautan baharu untuk anda.
            </p>
            <Link href="/login" className="btn btn-primary mt-6">Ke halaman log masuk</Link>
          </div>
        ) : (
          <div className="panel mt-6 p-7">
            <h1 className="font-display text-3xl font-bold">{t.type === "ACTIVATION" ? "Aktifkan akaun anda" : "Tetapkan semula kata laluan"}</h1>
            <p className="mt-2 text-muted">
              Akaun <b className="text-ink">{t.user.name}</b>, nama pengguna <code className="font-semibold text-ink">{t.user.username}</code>. Pilih kata laluan yang hanya anda tahu.
            </p>
            <div className="mt-6">
              <SetPasswordForm token={token} />
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
