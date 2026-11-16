"use client";

export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="panel mx-auto mt-10 max-w-lg p-8 text-center">
      <h1 className="font-display text-3xl font-bold">Halaman ini gagal dimuatkan</h1>
      <p className="mt-2 text-muted">Ralat sistem berlaku semasa memuatkan data. Cuba lagi; jika masalah berterusan, berikan kod rujukan kepada pentadbir.</p>
      {error.digest && <p className="mt-3 text-sm">Kod rujukan: <code className="font-semibold">{error.digest}</code></p>}
      <button className="btn btn-primary mt-6" onClick={reset}>Cuba lagi</button>
    </div>
  );
}
