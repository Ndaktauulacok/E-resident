import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requirePage } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";
import { USER_STATUS } from "@/lib/labels";
import { GRANTABLE, PERMISSIONS, type RoleKeyT } from "@/lib/permissions";
import { Badge, DL, PageHeader, Panel } from "@/components/ui";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/forms";
import { SessionList } from "@/components/sessions";
import { UserFields } from "../fields";
import { issueLinkAction, setOverridesAction, setUserStatusAction, updateUserAction } from "../actions";

export const metadata = { title: "Urus akaun" };

export default async function UserPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await requirePage("users.manage");
  const { id } = await params;
  const u = await db.user.findUnique({
    where: { id },
    include: { role: true, resident: { include: { dorm: true } }, permissionOverrides: { include: { permission: true } }, blocksHeaded: true, blocksAssisted: true, dormsHeaded: true, dormsAssisted: true },
  });
  if (!u) notFound();
  const self = u.id === me.id;
  const grantable = GRANTABLE[u.role.key as RoleKeyT] ?? [];
  const granted = new Set(u.permissionOverrides.filter((o) => o.granted).map((o) => o.permission.key));
  const posts = [
    ...u.blocksHeaded.map((b) => `Ketua Blok ${b.code}`), ...u.blocksAssisted.map((b) => `Penolong Ketua Blok ${b.code}`),
    ...u.dormsHeaded.map((d) => `Ketua Dorm ${d.code}`), ...u.dormsAssisted.map((d) => `Penolong Ketua Dorm ${d.code}`),
  ];
  const st = USER_STATUS[u.status];

  return (
    <>
      <PageHeader title={u.name} desc={`${u.username}, ${u.role.name}`} back={{ href: "/akaun", label: "Akaun & role" }} actions={<Badge tone={st.tone} className="!text-sm">{st.label}</Badge>} />
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title="Ringkasan">
            <DL items={[
              ["Role", u.role.name], ["Jawatan semasa", posts.join(", ") || "Tiada"],
              ["Rekod penghuni", u.resident ? <Link key="r" className="link" href={`/penghuni/${u.resident.id}`}>{u.resident.matricNo}, {u.resident.dorm.code}</Link> : "Tiada"],
              ["Log masuk terakhir", u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : "Belum pernah"],
              ["Dicipta", fmtDateTime(u.createdAt)], ["Kemas kini", fmtDateTime(u.updatedAt)],
            ]} />
          </Panel>
          <Panel title="Edit akaun">
            <ActionForm action={updateUserAction}>
              <input type="hidden" name="id" value={u.id} />
              <UserFields u={{ ...u, role: u.role.key }} lockRole={self} />
              <p className="field-hint mt-3">Menukar role akan menamatkan semua sesi pengguna ini dan membuang kebenaran tambahan.</p>
              <div className="mt-4 flex justify-end"><SubmitButton>Simpan</SubmitButton></div>
            </ActionForm>
          </Panel>
          <Panel title="Sesi log masuk aktif"><SessionList userId={u.id} currentSessionId={me.sessionId} /></Panel>
        </div>
        <aside className="space-y-6">
          <Panel title="Akses">
            <div className="flex flex-col gap-2">
              {u.status !== "INACTIVE" && (
                <ConfirmAction action={issueLinkAction} fields={{ id: u.id }} tone="primary"
                  label={u.status === "PENDING_ACTIVATION" ? "Jana pautan pengaktifan" : "Jana pautan reset kata laluan"}
                  title={u.status === "PENDING_ACTIVATION" ? "Jana pautan pengaktifan baharu?" : "Jana pautan reset kata laluan?"}
                  body="Pautan sekali guna akan dipaparkan sekali sahaja. Pautan lama tidak lagi sah." confirmLabel="Jana pautan" />
              )}
              {!self && (u.status === "ACTIVE" ? (
                <ConfirmAction action={setUserStatusAction} fields={{ id: u.id, to: "INACTIVE" }} tone="danger" label="Nyahaktifkan akaun" title={`Nyahaktifkan ${u.username}?`} body="Pengguna akan dilog keluar serta-merta dan tidak boleh log masuk sehingga diaktifkan semula. Rekod dan sejarah dikekalkan." confirmLabel="Nyahaktifkan" />
              ) : u.status === "INACTIVE" ? (
                <ConfirmAction action={setUserStatusAction} fields={{ id: u.id, to: "ACTIVE" }} tone="ok" label="Aktifkan semula" title={`Aktifkan semula ${u.username}?`} confirmLabel="Aktifkan" />
              ) : null)}
            </div>
          </Panel>
          {grantable.length > 0 && (
            <Panel title="Kebenaran tambahan">
              <ActionForm action={setOverridesAction} className="space-y-2.5">
                <input type="hidden" name="id" value={u.id} />
                <p className="pb-1 text-sm text-muted">Role Penolong bermula dengan akses asas. Tandakan tugasan yang diamanahkan. Semua tindakan tetap direkodkan atas nama akaun ini.</p>
                {grantable.map((p) => (
                  <label key={p} className="flex items-start gap-2.5">
                    <input type="checkbox" name="perm" value={p} defaultChecked={granted.has(p)} className="mt-1 size-4 accent-[#172036]" />
                    <span className="text-sm">{PERMISSIONS[p].description}</span>
                  </label>
                ))}
                <SubmitButton className="btn btn-primary mt-2 w-full">Simpan kebenaran</SubmitButton>
              </ActionForm>
            </Panel>
          )}
        </aside>
      </div>
    </>
  );
}
