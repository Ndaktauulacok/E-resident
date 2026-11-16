import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-[70dvh] items-center justify-center px-6">
      <div className="max-w-md text-center">
        <p className="font-display text-7xl font-bold text-[#c3cad7]">404</p>
        <h1 className="mt-2 font-display text-3xl font-bold">Rekod atau halaman tidak dijumpai</h1>
        <p className="mt-2 text-muted">Pautan mungkin salah, atau rekod telah dialihkan.</p>
        <Link href="/dashboard" className="btn btn-primary mt-6">Kembali ke dashboard</Link>
      </div>
    </main>
  );
}
