import Link from "next/link";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";
import { EmptyState, PAGE_SIZE, PageHeader, Pagination, pageOf } from "@/components/ui";
import { markAllReadAction } from "../actions";

export const metadata = { title: "Notifikasi" };

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const me = await requireUser();
  const sp = await searchParams;
  const page = pageOf(sp);
  const [total, unread, rows] = await Promise.all([
    db.notification.count({ where: { userId: me.id } }),
    db.notification.count({ where: { userId: me.id, readAt: null } }),
    db.notification.findMany({ where: { userId: me.id }, orderBy: { createdAt: "desc" }, skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);
  return (
    <>
      <PageHeader
        title="Notifikasi"
        desc={unread ? `${unread} belum dibaca` : "Semua notifikasi telah dibaca."}
        actions={unread > 0 && <form action={markAllReadAction}><button className="btn btn-ghost">Tanda semua dibaca</button></form>}
      />
      <div className="panel overflow-hidden">
        {rows.length === 0 ? <EmptyState title="Tiada notifikasi" desc="Notifikasi tentang laporan dan permohonan anda akan muncul di sini." /> : (
          <ul className="divide-y divide-line-2">
            {rows.map((n) => (
              <li key={n.id}>
                <Link href={`/notifikasi/buka/${n.id}`} prefetch={false} className="flex gap-3 px-5 py-4 hover:bg-paper">
                  <span className={`mt-2 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-sign"}`} aria-label={n.readAt ? undefined : "Belum dibaca"} />
                  <span>
                    <span className="block font-semibold">{n.title}</span>
                    {n.body && <span className="block text-sm text-muted">{n.body}</span>}
                    <span className="block text-[0.78rem] text-faint">{fmtDateTime(n.createdAt)}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total} params={sp} basePath="/notifikasi" />
      </div>
    </>
  );
}
