export default function Loading() {
  return (
    <div aria-busy="true" aria-label="Memuatkan" className="animate-pulse">
      <div className="h-9 w-72 rounded bg-line" />
      <div className="mt-3 h-4 w-96 max-w-full rounded bg-line-2" />
      <div className="mt-8 grid gap-4 md:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 rounded-[12px] bg-white" />)}
      </div>
      <div className="mt-6 h-72 rounded-[12px] bg-white" />
    </div>
  );
}
