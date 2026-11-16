import { Fragment } from "react";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/permissions";
import { PageHeader } from "@/components/ui";

export const metadata = { title: "Permission matrix" };

export default async function RoleMatrixPage() {
  await requirePage("users.manage");
  const roles = await db.role.findMany({ orderBy: { rank: "asc" }, include: { permissions: { include: { permission: true } }, _count: { select: { users: true } } } });
  const has = new Map(roles.map((r) => [r.id, new Set(r.permissions.map((p) => p.permission.key))]));
  const modules = [...new Set(Object.values(PERMISSIONS).map((p) => p.module))];

  return (
    <>
      <PageHeader title="Permission matrix" desc="Kebenaran asas bagi setiap role, dibaca terus daripada pangkalan data. Semakan dibuat di server pada setiap halaman dan tindakan." back={{ href: "/akaun", label: "Akaun & role" }} />
      <div className="panel overflow-x-auto">
        <table className="tbl min-w-[64rem]">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 min-w-64 bg-[#f7f8fb]">Kebenaran</th>
              {roles.map((r) => <th key={r.id} className="!whitespace-normal text-center !text-[0.75rem] leading-tight">{r.name}<span className="block font-normal text-faint">{r._count.users} akaun</span></th>)}
            </tr>
          </thead>
          <tbody>
            {modules.map((m) => (
              <Fragment key={m}>
                <tr><td colSpan={roles.length + 1} className="sticky left-0 !bg-paper font-display text-[1.05rem] font-semibold">{m}</td></tr>
                {Object.entries(PERMISSIONS).filter(([, p]) => p.module === m).map(([k, p]) => (
                  <tr key={k}>
                    <td className="sticky left-0 bg-white text-sm">{p.description}</td>
                    {roles.map((r) => (
                      <td key={r.id} className="text-center">
                        {has.get(r.id)!.has(k) ? <span className="inline-block size-3 rounded-full bg-ok" aria-label="Ya" /> : <span className="inline-block size-3 rounded-full border border-line" aria-label="Tidak" />}
                      </td>
                    ))}
                  </tr>
                ))}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-4 text-sm text-muted">Selain kebenaran di atas, data turut ditapis mengikut skop: Warden mengikut blok yang ditetapkan, Ketua/Penolong Ketua Blok mengikut blok sendiri, Ketua/Penolong Ketua Dorm mengikut dorm sendiri.</p>
    </>
  );
}
