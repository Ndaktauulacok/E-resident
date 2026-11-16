import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";
import { DL, PageHeader, Panel } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { SessionList } from "@/components/sessions";
import { changePasswordAction } from "./actions";

export const metadata = { title: "Profil & keselamatan" };

export default async function ProfilePage() {
  const me = await requireUser();
  const u = await db.user.findUniqueOrThrow({ where: { id: me.id }, include: { role: true } });
  return (
    <>
      <PageHeader title="Profil & keselamatan" desc="Maklumat akaun anda dan sesi log masuk yang aktif." />
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          <Panel title="Akaun">
            <DL items={[["Nama", u.name], ["Nama pengguna", u.username], ["Role", u.role.name], ["E-mel", u.email], ["No. telefon", u.phone], ["Log masuk terakhir", u.lastLoginAt ? fmtDateTime(u.lastLoginAt) : null]]} />
            <p className="mt-4 text-sm text-muted">Untuk menukar nama atau role, hubungi Admin atau Ketua Warden.</p>
          </Panel>
          <Panel title="Sesi aktif"><SessionList userId={me.id} currentSessionId={me.sessionId} /></Panel>
        </div>
        <Panel title="Tukar kata laluan">
          <ActionForm action={changePasswordAction} resetOnSuccess className="space-y-4">
            <div>
              <label className="field-label" htmlFor="current">Kata laluan semasa</label>
              <input id="current" name="current" type="password" className="input" autoComplete="current-password" required />
            </div>
            <div>
              <label className="field-label" htmlFor="password">Kata laluan baharu</label>
              <input id="password" name="password" type="password" className="input" autoComplete="new-password" required minLength={10} />
              <p className="field-hint">Sekurang-kurangnya 10 aksara, mengandungi huruf dan nombor. Sesi lain akan ditamatkan.</p>
            </div>
            <div>
              <label className="field-label" htmlFor="confirm">Taip semula kata laluan baharu</label>
              <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" required />
            </div>
            <SubmitButton>Tukar kata laluan</SubmitButton>
          </ActionForm>
        </Panel>
      </div>
    </>
  );
}
