import { ROLE_KEYS, ROLE_META } from "@/lib/permissions";

type U = { name?: string; username?: string; email?: string | null; phone?: string | null; role?: string };

export function UserFields({ u = {}, lockRole }: { u?: U; lockRole?: boolean }) {
  return (
    <div className="space-y-4">
      <div>
        <label className="field-label" htmlFor="u-name">Nama penuh</label>
        <input id="u-name" name="name" className="input" defaultValue={u.name} required minLength={3} maxLength={120} />
      </div>
      <div>
        <label className="field-label" htmlFor="u-username">Nama pengguna</label>
        <input id="u-username" name="username" className="input lowercase" defaultValue={u.username} required pattern="[a-zA-Z0-9._\-]{3,60}" autoComplete="off" />
      </div>
      <div>
        <label className="field-label" htmlFor="u-email">E-mel (pilihan)</label>
        <input id="u-email" name="email" type="email" className="input" defaultValue={u.email ?? ""} />
      </div>
      <div>
        <label className="field-label" htmlFor="u-phone">No. telefon (pilihan)</label>
        <input id="u-phone" name="phone" className="input" defaultValue={u.phone ?? ""} inputMode="tel" />
      </div>
      <div>
        <label className="field-label" htmlFor="u-role">Role</label>
        {lockRole && <input type="hidden" name="role" value={u.role} />}
        <select id="u-role" name={lockRole ? undefined : "role"} className="input" defaultValue={u.role ?? ""} required disabled={lockRole}>
          <option value="" disabled>Pilih role</option>
          {ROLE_KEYS.map((k) => <option key={k} value={k}>{ROLE_META[k].name}</option>)}
        </select>
        {lockRole && <p className="field-hint">Anda tidak boleh menukar role akaun sendiri.</p>}
      </div>
    </div>
  );
}
