import { Suspense } from "react";
import { can, getScope, requireUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getQueue } from "@/lib/queue";
import { relTime } from "@/lib/dates";
import { MobileNav, NotificationBell, ProfileMenu, SearchBox, Sidebar, Toaster, type NavItem } from "@/components/shell";
import { logoutAction, markAllReadAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const scope = await getScope(user);
  const [queue, notifs, unread, inst] = await Promise.all([
    can(user, "approvals.view") ? getQueue(user, scope) : Promise.resolve([]),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.notification.count({ where: { userId: user.id, readAt: null } }),
    db.systemSetting.findUnique({ where: { key: "institution.name" } }),
  ]);
  const institution = String(inst?.value ?? "");

  // Menu dibina berdasarkan kebenaran sebenar pengguna (halaman juga menyemak semula di server)
  const nav: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "LayoutDashboard", group: "Utama" },
    ...(can(user, "approvals.view") ? [{ href: "/semakan", label: "Semakan & Pengesahan", icon: "Inbox", group: "Utama", badge: queue.length } as NavItem] : []),
    ...(can(user, "attendance.view") ? [{ href: "/kehadiran", label: "Laporan Kehadiran", icon: "ClipboardCheck", group: "Kehadiran" } as NavItem] : []),
    ...(can(user, "monitoring.view") ? [{ href: "/pemantauan", label: "Pemantauan Langsung", icon: "RadioTower", group: "Kehadiran" } as NavItem] : []),
    ...(can(user, "residents.view") ? [{ href: "/penghuni", label: "Penghuni", icon: "Users", group: "Asrama" } as NavItem] : []),
    ...(can(user, "blocks.view") ? [{ href: "/blok", label: "Blok & Dorm", icon: "Building2", group: "Asrama" } as NavItem] : []),
    ...(can(user, "schedule.view") ? [{ href: "/jadual", label: "Jadual Bertugas Warden", icon: "CalendarClock", group: "Asrama" } as NavItem] : []),
    ...(can(user, "users.manage") ? [{ href: "/akaun", label: "Akaun & Role", icon: "UserCog", group: "Pentadbiran" } as NavItem] : []),
    ...(can(user, "audit.view") ? [{ href: "/audit", label: "Audit Log", icon: "ScrollText", group: "Pentadbiran" } as NavItem] : []),
  ];

  return (
    <div className="min-h-dvh">
      <Sidebar items={nav} institution={institution} />
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-paper/90 px-4 backdrop-blur sm:px-6 lg:px-10">
          <MobileNav items={nav} institution={institution} />
          {can(user, "residents.view") ? <SearchBox action="/penghuni" placeholder="Cari penghuni (nama atau no. matrik)" /> : <div />}
          <div className="ml-auto flex items-center gap-1.5">
            <NotificationBell
              unread={unread}
              markAll={markAllReadAction}
              items={notifs.map((n) => ({ id: n.id, title: n.title, body: n.body, link: n.link, when: relTime(n.createdAt), unread: !n.readAt }))}
            />
            <ProfileMenu name={user.name} role={user.roleName} logout={logoutAction} />
          </div>
        </header>
        <main className="mx-auto max-w-[1280px] px-4 py-8 sm:px-6 lg:px-10">{children}</main>
      </div>
      <Suspense>
        <Toaster />
      </Suspense>
    </div>
  );
}
