import { db } from "@/lib/db";
import { can, dormFilter, getScope, isFullAccess, requireUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { EmptyState, PageHeader } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { ResidentFields } from "../fields";
import { createResidentAction } from "../actions";

export const metadata = { title: "Daftar penghuni" };

export default async function NewResidentPage() {
  const user = await requireUser();
  if (!can(user, "residents.register") && !can(user, "residents.manage")) redirect("/tiada-akses");
  const scope = await getScope(user);
  const direct = (isFullAccess(user) || user.role === "WARDEN") && can(user, "residents.manage");
  const dorms = await db.dorm.findMany({
    where: { ...dormFilter(scope), isActive: true },
    include: { block: true, _count: { select: { residents: { where: { status: { in: ["AKTIF", "MENUNGGU_PENDAFTARAN"] } } } } } },
    orderBy: { code: "asc" },
  });

  return (
    <>
      <PageHeader
        title={direct ? "Tambah penghuni" : "Daftar penghuni"}
        desc={direct ? "Rekod ditambah terus sebagai penghuni aktif." : "Permohonan akan disemak oleh Ketua Blok, kemudian disahkan oleh Warden sebelum penghuni diaktifkan."}
        back={{ href: "/penghuni", label: "Penghuni" }}
      />
      {dorms.length === 0 ? (
        <div className="panel"><EmptyState title="Tiada dorm dalam bidang kuasa anda" /></div>
      ) : dorms.every((d) => d._count.residents >= d.capacity) ? (
        <div className="panel"><EmptyState title="Dorm anda sudah penuh" desc="Bilangan penghuni aktif dan permohonan tertunda telah mencapai kapasiti. Hubungi Warden jika kapasiti perlu dikemas kini." /></div>
      ) : (
        <div className="panel max-w-3xl p-6">
          <ActionForm action={createResidentAction} refresh={false}>
            <div className="space-y-5">
              <div>
                <label className="field-label" htmlFor="dormId">Dorm</label>
                <select id="dormId" name="dormId" className="input" required defaultValue={dorms.length === 1 ? dorms[0].id : ""}>
                  {dorms.length > 1 && <option value="" disabled>Pilih dorm</option>}
                  {dorms.map((d) => (
                    <option key={d.id} value={d.id} disabled={d._count.residents >= d.capacity}>
                      {d.code}, Blok {d.block.name} ({d.block.gender === "LELAKI" ? "lelaki" : "perempuan"}), {d._count.residents}/{d.capacity}{d._count.residents >= d.capacity ? ", penuh" : ""}
                    </option>
                  ))}
                </select>
              </div>
              <ResidentFields fixedGender={dorms.length === 1 ? dorms[0].block.gender : undefined} />
              <label className="flex items-start gap-3 rounded-[8px] border border-line bg-paper p-4">
                <input type="checkbox" name="requestAccount" defaultChecked className="mt-1 size-4 accent-[#172036]" />
                <span>
                  <b className="block">{direct ? "Cipta akaun login" : "Mohon akaun login untuk penghuni ini"}</b>
                  <span className="text-sm text-muted">Selepas diluluskan, sistem menjana pautan pengaktifan sekali guna. Penghuni menetapkan kata laluan sendiri; kata laluan tidak pernah dilihat oleh sesiapa.</span>
                </span>
              </label>
              <div className="flex justify-end">
                <SubmitButton className="btn btn-tag">{direct ? "Tambah penghuni" : "Hantar permohonan"}</SubmitButton>
              </div>
            </div>
          </ActionForm>
        </div>
      )}
    </>
  );
}
