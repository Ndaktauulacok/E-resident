import Link from "next/link";

export const metadata = { title: "Tiada akses" };

export default function NoAccess() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl font-bold text-[#c3cad7]">403</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Halaman ini di luar kebenaran anda</h1>
        <p className="mt-2 text-muted">
          Role anda tidak mempunyai akses ke halaman ini. Jika anda memerlukan akses, minta Admin atau Ketua Warden memberikan kebenaran.
        </p>
        <Link href="/dashboard" className="btn btn-primary mt-6">Kembali ke dashboard</Link>
      </div>
    </main>
  );
}
