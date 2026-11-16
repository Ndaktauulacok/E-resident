type B = { code?: string; name?: string; gender?: string; description?: string | null; isActive?: boolean };
type D = { code?: string; floor?: number; capacity?: number; isActive?: boolean };

export function BlockFields({ b = {}, edit }: { b?: B; edit?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[8rem_1fr_1fr]">
      <div>
        <label className="field-label" htmlFor="b-code">Kod</label>
        <input id="b-code" name="code" className="input uppercase" defaultValue={b.code} required maxLength={10} placeholder="D" />
      </div>
      <div>
        <label className="field-label" htmlFor="b-name">Nama blok</label>
        <input id="b-name" name="name" className="input" defaultValue={b.name} required maxLength={80} placeholder="Kenanga" />
      </div>
      <div>
        <label className="field-label" htmlFor="b-gender">Jenis asrama</label>
        <select id="b-gender" name="gender" className="input" defaultValue={b.gender ?? ""} required>
          <option value="" disabled>Pilih</option>
          <option value="LELAKI">Lelaki</option>
          <option value="PEREMPUAN">Perempuan</option>
        </select>
      </div>
      <div className="sm:col-span-3">
        <label className="field-label" htmlFor="b-desc">Keterangan (pilihan)</label>
        <input id="b-desc" name="description" className="input" defaultValue={b.description ?? ""} maxLength={255} />
      </div>
      {edit && (
        <label className="flex items-center gap-2.5 sm:col-span-3">
          <input type="checkbox" name="isActive" defaultChecked={b.isActive} className="size-4 accent-[#172036]" /> Blok aktif
        </label>
      )}
    </div>
  );
}

export function DormFields({ d = {}, edit }: { d?: D; edit?: boolean }) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="field-label" htmlFor={`d-code-${d.code ?? "new"}`}>Kod dorm</label>
        <input id={`d-code-${d.code ?? "new"}`} name="code" className="input uppercase" defaultValue={d.code} required maxLength={10} placeholder="A-301" />
      </div>
      <div>
        <label className="field-label" htmlFor={`d-floor-${d.code ?? "new"}`}>Aras</label>
        <input id={`d-floor-${d.code ?? "new"}`} name="floor" type="number" min={0} max={30} className="input" defaultValue={d.floor ?? 1} required />
      </div>
      <div>
        <label className="field-label" htmlFor={`d-cap-${d.code ?? "new"}`}>Kapasiti</label>
        <input id={`d-cap-${d.code ?? "new"}`} name="capacity" type="number" min={1} max={60} className="input" defaultValue={d.capacity ?? 8} required />
      </div>
      {edit && (
        <label className="flex items-center gap-2.5 sm:col-span-3">
          <input type="checkbox" name="isActive" defaultChecked={d.isActive} className="size-4 accent-[#172036]" /> Dorm aktif
        </label>
      )}
    </div>
  );
}
