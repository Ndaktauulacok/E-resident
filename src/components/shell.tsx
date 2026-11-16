"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
import {
  Bell, LayoutDashboard, ClipboardCheck, RadioTower, Inbox, Users, Building2, CalendarClock, UserCog, ScrollText, Menu, X, LogOut, UserRound, GraduationCap,
} from "lucide-react";
import { KvspChip } from "./brand";

const ICONS = { LayoutDashboard, ClipboardCheck, RadioTower, Inbox, Users, Building2, CalendarClock, UserCog, ScrollText, GraduationCap };
export type NavItem = { href: string; label: string; icon: keyof typeof ICONS; badge?: number; group: string };

function NavList({ items, onNavigate }: { items: NavItem[]; onNavigate?: () => void }) {
  const path = usePathname();
  const groups = [...new Set(items.map((i) => i.group))];
  return (
    <nav className="flex flex-col gap-6" aria-label="Menu utama">
      {groups.map((g) => (
        <div key={g}>
          <p className="mb-1.5 px-3 text-[0.72rem] font-bold uppercase tracking-[.14em] text-white/45">{g}</p>
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
                      "relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.93rem] font-medium transition-all duration-200",
                      active ? "bg-white/15 text-white shadow-[0_8px_20px_-10px_rgba(0,0,0,.5)] ring-1 ring-white/20" : "text-white/70 hover:translate-x-1 hover:bg-white/10 hover:text-white",
                    )}
                  >
                    {active && <span className="absolute -left-4 top-2 bottom-2 w-1.5 rounded-r bg-gradient-to-b from-amber-300 to-pink-400" aria-hidden />}
                    <Icon size={18} strokeWidth={1.8} aria-hidden />
                    <span className="flex-1">{i.label}</span>
                    {!!i.badge && <span className="rounded-full bg-gradient-to-r from-amber-300 to-orange-400 px-1.5 text-[0.72rem] font-bold text-ink shadow">{i.badge}</span>}
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
      <KvspChip height={28} />
      <span className="leading-tight">
        <span className="block font-display text-[1.3rem] font-bold tracking-wide text-white">E-RESIDENT</span>
        <span className="block max-w-[11rem] truncate text-[0.74rem] text-white/50">{institution}</span>
      </span>
    </Link>
  );
}

export function Sidebar({ items, institution }: { items: NavItem[]; institution: string }) {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col gap-8 overflow-y-auto sidebar-grad px-4 py-6 shadow-[8px_0_30px_-12px_rgba(76,29,149,.5)] lg:flex">
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
          <div className="absolute inset-0 bg-[#1e1b4b]/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="plate-in absolute inset-y-0 left-0 flex w-72 flex-col gap-8 overflow-y-auto sidebar-grad px-4 py-6">
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
        <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-violet-500 to-pink-500 font-display text-sm font-semibold uppercase text-white shadow-md ring-2 ring-white">{ini}</span>
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
    <div role="status" className="pop fixed bottom-5 left-1/2 z-[60] flex -translate-x-1/2 items-center gap-3 rounded-2xl bg-ink px-5 py-3.5 text-sm font-medium text-white shadow-[0_20px_40px_-15px_rgba(124,58,237,.7)]">
      <span className="live-dot size-2.5 rounded-full bg-amber-300" aria-hidden />
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
