import Link from "next/link";
import clsx from "clsx";
import type { Tone } from "@/lib/labels";

export function PageHeader({ title, desc, actions, back }: { title: string; desc?: React.ReactNode; actions?: React.ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {back && (
          <Link href={back.href} className="mb-2 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-ink">
            <span aria-hidden>‹</span> {back.label}
          </Link>
        )}
        <h1 className="text-[2rem] font-bold text-ink sm:text-[2.25rem]">{title}</h1>
        {desc && <p className="mt-1 max-w-2xl text-[0.95rem] text-muted">{desc}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

const toneCls: Record<Tone, string> = {
  neutral: "bg-line-2 text-ink-3",
  info: "bg-sign-soft text-sign",
  warn: "bg-warn-soft text-warn",
  danger: "bg-danger-soft text-danger",
  ok: "bg-ok-soft text-ok",
  ink: "bg-ink text-white",
};
export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: React.ReactNode; className?: string }) {
  return (
    <span className={clsx("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.78rem] font-semibold", toneCls[tone], className)}>
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {children}
    </span>
  );
}

export function Panel({ title, actions, children, className, pad = true }: { title?: React.ReactNode; actions?: React.ReactNode; children: React.ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={clsx("panel", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-line px-5 py-3.5">
          <h2 className="font-display text-[1.2rem] font-semibold">{title}</h2>
          {actions}
        </header>
      )}
      <div className={clsx(pad && "p-5")}>{children}</div>
    </section>
  );
}

export function EmptyState({ title, desc, action }: { title: string; desc?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden className="mb-4 text-line">
        <rect x="12" y="6" width="32" height="44" rx="3" fill="none" stroke="currentColor" strokeWidth="3" />
        <circle cx="36" cy="29" r="2.5" fill="currentColor" />
      </svg>
      <p className="font-display text-xl font-semibold">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-muted">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Field({ label, hint, children, htmlFor }: { label: string; hint?: string; children: React.ReactNode; htmlFor?: string }) {
  return (
    <div>
      <label className="field-label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && <p className="field-hint">{hint}</p>}
    </div>
  );
}

export function Stat({ label, value, sub, href }: { label: string; value: React.ReactNode; sub?: React.ReactNode; href?: string }) {
  const body = (
    <>
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-1 font-display text-[2.4rem] font-bold leading-none">{value}</p>
      {sub && <p className="mt-2 text-[0.82rem] text-muted">{sub}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="block px-5 py-4 hover:bg-[#fafbfd]">{body}</Link>
  ) : (
    <div className="px-5 py-4">{body}</div>
  );
}

/** Paginasi (mengekalkan parameter carian/penapis) */
export function Pagination({ page, pages, total, params, basePath }: { page: number; pages: number; total: number; params: Record<string, string | undefined>; basePath: string }) {
  if (pages <= 1) return <p className="px-5 py-3 text-sm text-muted">{total} rekod</p>;
  const href = (p: number) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v && k !== "page" && q.set(k, v));
    q.set("page", String(p));
    return `${basePath}?${q}`;
  };
  return (
    <nav className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm" aria-label="Paginasi">
      <span className="text-muted">Halaman {page} daripada {pages}, {total} rekod</span>
      <div className="flex gap-2">
        {page > 1 ? <Link className="btn btn-ghost btn-sm" href={href(page - 1)}>Sebelum</Link> : <span className="btn btn-ghost btn-sm opacity-40">Sebelum</span>}
        {page < pages ? <Link className="btn btn-ghost btn-sm" href={href(page + 1)}>Seterusnya</Link> : <span className="btn btn-ghost btn-sm opacity-40">Seterusnya</span>}
      </div>
    </nav>
  );
}

export function Initials({ name, className }: { name: string; className?: string }) {
  const parts = name.replace(/^(En\.|Pn\.|Cik|Dr\.)\s*/i, "").split(/\s+/).filter((w) => !/^(bin|binti)$/i.test(w));
  const ini = (parts[0]?.[0] ?? "?") + (parts[1]?.[0] ?? "");
  return (
    <span className={clsx("inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-ink-2 font-display text-sm font-semibold uppercase text-white", className)} aria-hidden>
      {ini}
    </span>
  );
}

export function DL({ items }: { items: [string, React.ReactNode][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
      {items.map(([k, v]) => (
        <div key={k}>
          <dt className="text-[0.8rem] font-medium text-muted">{k}</dt>
          <dd className="mt-0.5 font-medium">{v ?? "Tiada"}</dd>
        </div>
      ))}
    </dl>
  );
}

export const PAGE_SIZE = 15;
export function pageOf(sp: Record<string, string | undefined>) {
  return Math.max(1, Number(sp.page) || 1);
}
