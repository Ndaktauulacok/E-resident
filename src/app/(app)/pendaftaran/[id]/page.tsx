import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { can, getScope, inScope, isFullAccess, requireUser } from "@/lib/auth";
import { fmtDateTime } from "@/lib/dates";
import { REGISTRATION_STATUS } from "@/lib/labels";
import { Badge, DL, PageHeader, Panel } from "@/components/ui";
import { ActionForm, ConfirmAction, SubmitButton } from "@/components/forms";
import { ApprovalTrail } from "@/components/trail";
import { ResidentFields } from "../../penghuni/fields";
import { resubmitRegistrationAction, reviewRegistrationAction } from "../../penghuni/actions";

export const metadata = { title: "Permohonan pendaftaran" };

export default async function RegistrationPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  if (!["residents.view", "registration.review.block", "registration.review.warden", "residents.register"].some((p) => can(user, p as never))) redirect("/tiada-akses");
  const { id } = await params;
  const g = await db.residentRegistration.findUnique({
    where: { id },
    include: { resident: { include: { dorm: { include: { block: true } }, user: { select: { username: true } } } }, submittedBy: { select: { name: true } } },
  });
  if (!g) notFound();
  const scope = await getScope(user);
  if (!inScope(scope, g.resident.dormId)) redirect("/tiada-akses");

  const own = g.submittedById === user.id && !isFullAccess(user);
  const stage =
    g.status === "MENUNGGU_KETUA_BLOK" && can(user, "registration.review.block") ? "Ketua Blok" :
    g.status === "MENUNGGU_WARDEN" && can(user, "registration.review.warden") ? "Warden" : null;
  const canFix = g.status === "PERLU_PEMBETULAN" && can(user, "residents.register");
  const lastNote = ["PERLU_PEMBETULAN", "DITOLAK"].includes(g.status)
    ? await db.approval.findFirst({ where: { entityType: "RESIDENT_REGISTRATION", entityId: id, action: { in: ["KEMBALIKAN", "TOLAK"] } }, orderBy: { createdAt: "desc" }, include: { actor: { select: { name: true } } } })
    : null;
  const st = REGISTRATION_STATUS[g.status];
  const r = g.resident;

  return (
    <>
      <PageHeader
        title={`Pendaftaran ${r.fullName}`}
        desc={<>Dihantar oleh {g.submittedBy.name}, {fmtDateTime(g.submittedAt)}</>}
        back={{ href: "/semakan", label: "Semakan & pengesahan" }}
        actions={<Badge tone={st.tone} className="!text-sm">{st.label}</Badge>}
      />
      {lastNote && (
        <div className="mb-6 rounded-[12px] border border-[#efc4ca] bg-danger-soft px-5 py-4 text-[#8f1f2e]">
          <p className="font-semibold">{lastNote.action === "TOLAK" ? "Ditolak" : "Dikembalikan"} oleh {lastNote.actor.name}</p>
          <p className="mt-1">{lastNote.note}</p>
        </div>
      )}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <Panel title="Maklumat dimohon">
            <DL items={[
              ["Nama penuh", r.fullName], ["No. matrik", r.matricNo],
              ["Jantina", r.gender === "LELAKI" ? "Lelaki" : "Perempuan"], ["No. telefon", r.phone],
              ["Dorm", `${r.dorm.code}, Blok ${r.dorm.block.name}`], ["Akaun login", g.requestAccount ? (r.user ? `Dicipta: ${r.user.username}` : "Dimohon") : "Tidak dimohon"],
            ]} />
            {g.status === "DILULUSKAN" && <Link href={`/penghuni/${r.id}`} className="btn btn-ghost btn-sm mt-5">Buka rekod penghuni</Link>}
          </Panel>

          {canFix && (
            <Panel title="Betulkan & hantar semula">
              <ActionForm action={resubmitRegistrationAction}>
                <input type="hidden" name="id" value={g.id} />
                <ResidentFields r={r} />
                <label className="mt-4 flex items-center gap-3">
                  <input type="checkbox" name="requestAccount" defaultChecked={g.requestAccount} className="size-4 accent-[#172036]" />
                  <span>Mohon akaun login</span>
                </label>
                <div className="mt-5 flex justify-end"><SubmitButton className="btn btn-tag">Hantar semula</SubmitButton></div>
              </ActionForm>
            </Panel>
          )}
        </div>

        <aside className="space-y-6">
          {stage && (
            <Panel title={stage === "Warden" ? "Pengesahan akhir Warden" : "Semakan Ketua Blok"}>
              {own ? (
                <p className="text-sm text-muted">Anda menghantar permohonan ini. Semakan mesti dibuat oleh pengguna lain.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  <ConfirmAction action={reviewRegistrationAction} fields={{ id: g.id, decision: "LULUS" }} tone="ok"
                    label={stage === "Warden" ? "Sahkan & aktifkan" : "Luluskan"} confirmLabel={stage === "Warden" ? "Sahkan" : "Luluskan"}
                    title={stage === "Warden" ? "Sahkan pendaftaran ini?" : "Luluskan ke peringkat Warden?"}
                    body={stage === "Warden" ? (g.requestAccount ? "Penghuni akan diaktifkan dan akaun login dicipta. Pautan pengaktifan sekali guna akan dipaparkan sekali sahaja." : "Penghuni akan diaktifkan.") : "Permohonan akan dihantar kepada Warden untuk pengesahan akhir."}
                    note="Catatan (pilihan)" />
                  <ConfirmAction action={reviewRegistrationAction} fields={{ id: g.id, decision: "KEMBALIKAN" }} tone="ghost" label="Kembalikan untuk pembetulan" confirmLabel="Kembalikan" title="Kembalikan kepada Ketua Dorm?" note="Apa yang perlu dibetulkan?" noteRequired />
                  <ConfirmAction action={reviewRegistrationAction} fields={{ id: g.id, decision: "TOLAK" }} tone="danger" label="Tolak permohonan" confirmLabel="Tolak" title="Tolak permohonan ini?" body="Rekod disimpan untuk sejarah tetapi penghuni tidak akan diaktifkan." note="Sebab penolakan" noteRequired />
                </div>
              )}
            </Panel>
          )}
          <Panel title="Jejak semakan"><ApprovalTrail entityType="RESIDENT_REGISTRATION" entityId={g.id} /></Panel>
        </aside>
      </div>
    </>
  );
}
