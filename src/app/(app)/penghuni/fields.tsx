type R = { fullName?: string; matricNo?: string; gender?: string; phone?: string | null };

export function ResidentFields({ r = {}, fixedGender }: { r?: R; fixedGender?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="sm:col-span-2">
        <label className="field-label" htmlFor="fullName">Nama penuh</label>
        <input id="fullName" name="fullName" className="input" defaultValue={r.fullName} required minLength={3} maxLength={150} autoComplete="off" />
      </div>
      <div>
        <label className="field-label" htmlFor="matricNo">No. matrik / ID pelajar</label>
        <input id="matricNo" name="matricNo" className="input uppercase" defaultValue={r.matricNo} required pattern="[A-Za-z0-9-]{4,30}" placeholder="KV25-0123" />
        <p className="field-hint">Mesti unik. Turut digunakan sebagai nama pengguna akaun.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="gender">Jantina</label>
        <select id="gender" name="gender" className="input" defaultValue={r.gender ?? fixedGender ?? ""} required>
          <option value="" disabled>Pilih</option>
          <option value="LELAKI">Lelaki</option>
          <option value="PEREMPUAN">Perempuan</option>
        </select>
      </div>
      <div>
        <label className="field-label" htmlFor="phone">No. telefon (pilihan)</label>
        <input id="phone" name="phone" className="input" defaultValue={r.phone ?? ""} inputMode="tel" placeholder="012-3456789" />
      </div>
    </div>
  );
}
