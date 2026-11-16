import Link from "next/link";
import clsx from "clsx";
import { UserPlus, Users, CalendarDays, Activity, Search } from "lucide-react";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth";
import { fmtDateTime, relTime } from "@/lib/dates";
import { IC_RE } from "@/lib/login";
import { Badge, EmptyState, Initials, PAGE_SIZE, PageHeader, Pagination, pageOf } from "@/components/ui";
import { ConfirmAction } from "@/components/forms";
import { deleteStudentAction, resetStudentPasswordAction, toggleStudentAction } from "./actions";

export const metadata = { title: "Pelajar Berdaftar" };

const fmtIc = (ic: string) => `${ic.slice(0, 6)}-${ic.slice(6, 8)}-${ic.slice(8)}`;

export default async function StudentsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePage("users.manage");
  const sp = await searchParams;
  const page = pageOf(sp);
  const q = (sp.q ?? "").trim().replace(/-/g, "").slice(0, 60).toLowerCase();
  const status = sp.status === "ACTIVE" || sp.status === "INACTIVE" ? sp.status : "";

  // Pelajar daftar sendiri: role Penghuni dengan nama pengguna = no. IC 12 digit
  const all = (
    await db.user.findMany({
      where: { role: { key: "PENGHUNI" } },
      select: {
        id: true, username: true, name: true, phone: true, status: true, createdAt: true, lastLoginAt: true,
        resident: { select: { id: true, dorm: { select: { code: true, block: { select: { code: true } } } } } },
      },
      orderBy: { createdAt: "desc" },
    })
  ).filter((u) => IC_RE.test(u.username));

  const dayAgo = Date.now() - 86400_000;
  const weekAgo = Date.now() - 7 * 86400_000;
  const stats = {
    total: all.length,
    today: all.filter((u) => u.createdAt.getTime() >= dayAgo).length,
    week: all.filter((u) => u.createdAt.getTime() >= weekAgo).length,
    active: all.filter((u) => u.status === "ACTIVE").length,
  };

  const filtered = all.filter((u) => (!q || u.name.toLowerCase().includes(q) || u.username.includes(q)) && (!status || u.status === status));
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const rows = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <>
      <PageHeader
        title="Pelajar Berdaftar"
        desc="Senarai pelajar yang mendaftar sendiri melalui halaman Daftar Pelajar. Nama pengguna ialah no. IC; kata laluan ialah 4 digit terakhir IC."
        actions={<Link href="/daftar" target="_blank" className="btn btn-ghost"><UserPlus size={16} /> Buka borang daftar</Link>}
      />

      <section className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: "Jumlah pelajar", value: stats.total, icon: Users, grad: "from-navy-500 to-navy-700" },
          { label: "Daftar 24 jam", value: stats.today, icon: UserPlus, grad: "from-flame-500 to-crimson-500" },
          { label: "Daftar 7 hari", value: stats.week, icon: CalendarDays, grad: "from-amber-400 to-orange-500" },
          { label: "Akaun aktif", value: stats.active, icon: Activity, grad: "from-emerald-500 to-teal-500" },
        ].map((s, i) => (
          <div key={s.label} className="plate-in panel lift flex items-center gap-4 p-5" style={{ animationDelay: `${i * 70}ms` }}>
            <span className={clsx("flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg", s.grad)}>
              <s.icon size={22} />
            </span>
            <div>
              <p className="font-display text-[2.2rem] font-bold leading-none text-grad">{s.value}</p>
              <p className="mt-0.5 text-sm font-medium text-muted">{s.label}</p>
            </div>
          </div>
        ))}
      </section>

      <form method="get" className="panel mb-4 grid gap-3 p-4 sm:grid-cols-[1.6fr_1fr_auto]">
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input name="q" defaultValue={sp.q ?? ""} className="input pl-9" placeholder="Cari nama atau no. IC" aria-label="Carian" />
        </div>
        <select name="status" defaultValue={status} className="input" aria-label="Status">
          <option value="">Semua status</option>
          <option value="ACTIVE">Aktif</option>
          <option value="INACTIVE">Tidak aktif</option>
        </select>
        <button className="btn btn-primary">Cari</button>
      </form>

      <div className="panel overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            title={all.length === 0 ? "Belum ada pelajar mendaftar" : "Tiada pelajar sepadan"}
            desc={all.length === 0 ? "Pelajar boleh mendaftar melalui butang Daftar Pelajar di laman utama." : "Cuba carian lain."}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr><th>Pelajar</th><th>No. IC</th><th>Telefon</th><th>Dorm</th><th>Didaftar</th><th>Log masuk terakhir</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {rows.map((u) => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Initials name={u.name} />
                        <p className="font-semibold">{u.name}</p>
                      </div>
                    </td>
                    <td className="whitespace-nowrap font-mono text-[0.85rem]">{fmtIc(u.username)}</td>
                    <td className="whitespace-nowrap">{u.phone ?? <span className="text-faint">Tiada</span>}</td>
                    <td>{u.resident ? <Link className="link" href={`/penghuni/${u.resident.id}`}>{u.resident.dorm.code}</Link> : <span className="text-faint">Belum ditempatkan</span>}</td>
                    <td className="whitespace-nowrap text-sm" title={fmtDateTime(u.createdAt)}>{relTime(u.createdAt)}</td>
                    <td className="whitespace-nowrap text-sm">{u.lastLoginAt ? relTime(u.lastLoginAt) : <span className="text-faint">Belum</span>}</td>
                    <td><Badge tone={u.status === "ACTIVE" ? "ok" : "neutral"}>{u.status === "ACTIVE" ? "Aktif" : "Tidak aktif"}</Badge></td>
                    <td>
                      <div className="flex justify-end gap-1.5">
                        <ConfirmAction
                          action={toggleStudentAction} fields={{ id: u.id }} size="sm" tone="ghost"
                          label={u.status === "ACTIVE" ? "Nyahaktif" : "Aktifkan"}
                          title={u.status === "ACTIVE" ? `Nyahaktifkan ${u.name}?` : `Aktifkan ${u.name}?`}
                          body={u.status === "ACTIVE" ? "Pelajar tidak akan dapat log masuk sehingga diaktifkan semula." : "Pelajar boleh log masuk semula."}
                          confirmLabel={u.status === "ACTIVE" ? "Nyahaktifkan" : "Aktifkan"}
                        />
                        <ConfirmAction
                          action={resetStudentPasswordAction} fields={{ id: u.id }} size="sm" tone="ghost" label="Reset"
                          title="Tetapkan semula kata laluan?" body={<>Kata laluan {u.name} akan ditetapkan semula kepada <b>4 digit terakhir IC</b>.</>}
                          confirmLabel="Tetapkan semula"
                        />
                        <ConfirmAction
                          action={deleteStudentAction} fields={{ id: u.id }} size="sm" tone="danger" label="Padam"
                          title={`Padam akaun ${u.name}?`} body="Tindakan ini tidak boleh dibatalkan." confirmLabel="Padam akaun"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination page={page} pages={pages} total={filtered.length} params={sp} basePath="/pelajar" />
      </div>
    </>
  );
}
