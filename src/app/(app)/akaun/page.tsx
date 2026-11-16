import Link from "next/link";
import type { Prisma, RoleKey, UserStatus } from "@prisma/client";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth";
import { relTime } from "@/lib/dates";
import { USER_STATUS } from "@/lib/labels";
import { ROLE_KEYS, ROLE_META } from "@/lib/permissions";
import { Badge, EmptyState, Initials, PAGE_SIZE, PageHeader, Pagination, Panel, pageOf } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { createUserAction } from "./actions";
import { UserFields } from "./fields";

export const metadata = { title: "Akaun & role" };

export default async function UsersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  await requirePage("users.manage");
  const sp = await searchParams;
  const page = pageOf(sp);
  const q = (sp.q ?? "").trim().slice(0, 60);
  const where: Prisma.UserWhereInput = {
    ...(q ? { OR: [{ name: { contains: q } }, { username: { contains: q } }] } : {}),
    ...(sp.role && (ROLE_KEYS as readonly string[]).includes(sp.role) ? { role: { key: sp.role as RoleKey } } : {}),
    ...(sp.status && sp.status in USER_STATUS ? { status: sp.status as UserStatus } : {}),
  };
  const [total, users] = await Promise.all([
    db.user.count({ where }),
    db.user.findMany({ where, include: { role: true }, orderBy: [{ role: { rank: "asc" } }, { name: "asc" }], skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE }),
  ]);

  return (
    <>
      <PageHeader title="Akaun & role" desc="Setiap akaun mewakili seorang pengguna. Kata laluan tidak pernah disimpan atau dipaparkan dalam bentuk asal." actions={<Link href="/akaun/role" className="btn btn-ghost">Lihat permission matrix</Link>} />
      <div className="grid items-start gap-6 xl:grid-cols-[1fr_22rem]">
        <div>
          <form method="get" className="panel mb-4 grid gap-3 p-4 sm:grid-cols-[1.5fr_1fr_1fr_auto]">
            <input name="q" defaultValue={q} className="input" placeholder="Nama atau nama pengguna" aria-label="Carian" />
            <select name="role" defaultValue={sp.role ?? ""} className="input" aria-label="Role">
              <option value="">Semua role</option>
              {ROLE_KEYS.map((k) => <option key={k} value={k}>{ROLE_META[k].name}</option>)}
            </select>
            <select name="status" defaultValue={sp.status ?? ""} className="input" aria-label="Status">
              <option value="">Semua status</option>
              {Object.entries(USER_STATUS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
            <button className="btn btn-primary">Cari</button>
          </form>
          <div className="panel overflow-hidden">
            {users.length === 0 ? <EmptyState title="Tiada akaun sepadan" /> : (
              <div className="overflow-x-auto">
                <table className="tbl">
                  <thead><tr><th>Pengguna</th><th>Role</th><th>Status</th><th>Log masuk terakhir</th><th></th></tr></thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>
                          <div className="flex items-center gap-3">
                            <Initials name={u.name} />
                            <div><p className="font-semibold">{u.name}</p><p className="text-sm text-muted">{u.username}</p></div>
                          </div>
                        </td>
                        <td className="whitespace-nowrap">{u.role.name}</td>
                        <td><Badge tone={USER_STATUS[u.status].tone}>{USER_STATUS[u.status].label}</Badge></td>
                        <td className="whitespace-nowrap text-sm text-muted">{u.lastLoginAt ? relTime(u.lastLoginAt) : "Belum pernah"}</td>
                        <td className="text-right"><Link className="link" href={`/akaun/${u.id}`}>Urus</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <Pagination page={page} pages={Math.ceil(total / PAGE_SIZE)} total={total} params={sp} basePath="/akaun" />
          </div>
        </div>
        <Panel title="Cipta akaun">
          <ActionForm action={createUserAction} resetOnSuccess>
            <UserFields />
            <p className="field-hint mt-3">Akaun penghuni biasanya dicipta melalui aliran pendaftaran penghuni.</p>
            <SubmitButton className="btn btn-tag mt-4 w-full">Cipta akaun</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
