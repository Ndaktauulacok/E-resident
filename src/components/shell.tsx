"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  Bell, LayoutDashboard, ClipboardCheck, RadioTower, Inbox, Users, Building2, CalendarClock, UserCog, ScrollText, Menu, X, LogOut, UserRound,
} from "lucide-react";

const ICONS = { LayoutDashboard, ClipboardCheck, RadioTower, Inbox, Users, Building2, CalendarClock, UserCog, ScrollText };
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number; group: string };

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav className="flex flex-col gap-6" aria-label="Menu utama">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-1.5 px-3 text-[0.78rem] font-medium text-white/45">{g}</p>
          <ul className="flex flex-col gap-0.5">
            {items.filter((i) => i.group === g).map((i) => {
              const Icon = ICONS[i.icon];
              const active = path === i.href || path.startsWith(i.href + "/");
              return (
                <li key={i.href}>
                  <Link
                    href={i.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={clsx(
                      "relative flex items-center gap-3 rounded-[6px] px-3 py-2 text-[0.93rem] font-medium transition-colors",
                      active ? "bg-white/10 text-white" : "text-white/70 hover:bg-white/5 hover:text-white",
                    )}
                  >
                    {active && <span className="absolute -left-4 top-1.5 bottom-1.5 w-1 rounded-r bg-tag" aria-hidden />}
                    <Icon size={18} strokeWidth={1.8} aria-hidden />
                    <span className="flex-1">{i.label}</span>
                    {!!i.badge && <span className="rounded-full bg-tag px-1.5 text-[0.72rem] font-bold text-ink">{i.badge}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ institution }: { institution: string }) {
  return (
    <Link href="/dashboard" className="flex items-center gap-3 px-3">
      <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden>
        <rect width="32" height="32" rx="6" fill="#263150" />
        <rect x="8" y="6" width="16" height="20" rx="2" fill="none" stroke="#F5C542" strokeWidth="2.4" />
        <circle cx="19.5" cy="17" r="1.7" fill="#F5C542" />
      </svg>
      <span className="leading-tight">
        <span className="block font-display text-[1.3rem] font-bold tracking-wide text-white">E-RESIDENT</span>
        <span className="block max-w-[11rem] truncate text-[0.74rem] text-white/50">{institution}</span>
      </span>
    </Link>
  );
}

export function Sidebar({ items, institution }: { items: NavItem[]; institution: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 overflow-y-auto bg-ink px-4 py-6 lg:flex">
      <Brand institution={institution} />
      <NavList items={items} />
    </aside>
  );
}

export function MobileNav({ items, institution }: { items: NavItem[]; institution: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="btn btn-ghost btn-sm lg:hidden" onClick={() => setOpen(true)} aria-label="Buka menu"><Menu size={18} /></button>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div className="absolute inset-0 bg-ink/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-72 flex-col gap-8 overflow-y-auto bg-ink px-4 py-6">
            <div className="flex items-center justify-between">
              <Brand institution={institution} />
              <button className="text-white/70" onClick={() => setOpen(false)} aria-label="Tutup menu"><X /></button>
            </div>
            <NavList items={items} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}
    </>
  );
}

function useOutside(ref: React.RefObject<HTMLElement | null>, close: () => void) {
  useEffect(() => {
    const h = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && close();
    const k = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("mousedown", h);
    document.addEventListener("keydown", k);
    return () => { document.removeEventListener("mousedown", h); document.removeEventListener("keydown", k); };
  }, [ref, close]);
}

export type Notif = { id: string; title: string; body: string | null; link: string | null; when: string; unread: boolean };

export function NotificationBell({ items, unread, markAll }: { items: Notif[]; unread: number; markAll: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();
  useOutside(ref, () => setOpen(false));
  return (
    <div className="relative" ref={ref}>
      <button className="relative flex size-10 items-center justify-center rounded-full text-ink-3 hover:bg-line-2" onClick={() => setOpen((o) => !o)} aria-label={`Notifikasi, ${unread} belum dibaca`} aria-expanded={open}>
        <Bell size={20} strokeWidth={1.8} />
        {unread > 0 && <span className="absolute right-1.5 top-1.5 flex min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[0.66rem] font-bold text-white">{unread > 9 ? "9+" : unread}</span>}
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-[min(92vw,22rem)] overflow-hidden rounded-[12px] border border-line bg-white shadow-[0_18px_40px_-18px_rgba(23,32,54,.35)]">
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <p className="font-display text-lg font-semibold">Notifikasi</p>
            {unread > 0 && (
              <button className="text-sm font-semibold text-sign disabled:opacity-50" disabled={pending} onClick={() => start(async () => { await markAll(); router.refresh(); })}>
                Tanda semua dibaca
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted">Tiada notifikasi lagi.</li>}
            {items.map((n) => (
              <li key={n.id} className="border-b border-line-2 last:border-0">
                <Link href={`/notifikasi/buka/${n.id}`} prefetch={false} onClick={() => setOpen(false)} className="flex gap-3 px-4 py-3 hover:bg-paper">
                  <span className={clsx("mt-1.5 size-2 shrink-0 rounded-full", n.unread ? "bg-sign" : "bg-transparent")} aria-hidden />
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold">{n.title}</span>
                    {n.body && <span className="block truncate text-[0.82rem] text-muted">{n.body}</span>}
                    <span className="mt-0.5 block text-[0.75rem] text-faint">{n.when}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link href="/notifikasi" onClick={() => setOpen(false)} className="block border-t border-line px-4 py-2.5 text-center text-sm font-semibold text-sign hover:bg-paper">Lihat semua</Link>
        </div>
      )}
    </div>
  );
}

export function ProfileMenu({ name, role, logout }: { name: string; role: string; logout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutside(ref, () => setOpen(false));
  const ini = name.replace(/^(En\.|Pn\.|Cik)\s*/, "").split(" ").slice(0, 2).map((w) => w[0]).join("");
  return (
    <div className="relative" ref={ref}>
      <button className="flex items-center gap-2.5 rounded-full py-1 pl-1 pr-3 hover:bg-line-2" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-label="Menu profil">
        <span className="flex size-8 items-center justify-center rounded-full bg-ink font-display text-sm font-semibold uppercase text-tag">{ini}</span>
        <span className="hidden text-left leading-tight sm:block">
          <span className="block max-w-[10rem] truncate text-sm font-semibold">{name}</span>
          <span className="block text-[0.75rem] text-muted">{role}</span>
        </span>
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-2 w-56 overflow-hidden rounded-[12px] border border-line bg-white py-1 shadow-[0_18px_40px_-18px_rgba(23,32,54,.35)]">
          <Link href="/profil" onClick={() => setOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium hover:bg-paper"><UserRound size={16} /> Profil & keselamatan</Link>
          <form action={logout}>
            <button className="flex w-full items-center gap-2.5 px-4 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-soft"><LogOut size={16} /> Log keluar</button>
          </form>
        </div>
      )}
    </div>
  );
}

/** Notifikasi kejayaan selepas redirect (?ok=…) */
export function Toaster() {
  const sp = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  const msg = sp.get("ok");
  const [shown, setShown] = useState<string | null>(null);
  useEffect(() => {
    if (!msg) return;
    setShown(msg);
    const q = new URLSearchParams(sp.toString());
    q.delete("ok");
    router.replace(q.size ? `${path}?${q}` : path, { scroll: false });
    const t = setTimeout(() => setShown(null), 4200);
    return () => clearTimeout(t);
  }, [msg, sp, path, router]);
  if (!shown) return null;
  return (
    <div role="status" className="fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-[8px] bg-ink px-4 py-3 text-sm font-medium text-white shadow-lg">
      <span className="size-2 rounded-full bg-tag" aria-hidden />
      {shown}
    </div>
  );
}

/** Muat semula data halaman secara berkala (pemantauan langsung) */
export function AutoRefresh({ seconds = 30 }: { seconds?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => document.visibilityState === "visible" && router.refresh(), seconds * 1000);
    return () => clearInterval(t);
  }, [router, seconds]);
  return null;
}

/** Medan carian global (ke senarai penghuni) */
export function SearchBox({ action, placeholder }: { action: string; placeholder: string }) {
  return (
    <form action={action} className="relative hidden w-full max-w-sm md:block" role="search">
      <svg className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
      <input name="q" className="input !h-10 pl-9" placeholder={placeholder} aria-label={placeholder} />
    </form>
  );
}
