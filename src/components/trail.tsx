import clsx from "clsx";
import { db } from "@/lib/db";
import { fmtDateTime } from "@/lib/dates";
import { APPROVAL_ACTION, STAGE_LABEL } from "@/lib/labels";
import type { ApprovalEntity } from "@prisma/client";

const DOT: Record<string, string> = { HANTAR: "bg-sign", LULUS: "bg-ok", KEMBALIKAN: "bg-danger", TOLAK: "bg-danger", PINDA: "bg-warn" };

/** Jejak semakan: siapa, peringkat, tindakan, tarikh & masa, catatan */
export async function ApprovalTrail({ entityType, entityId }: { entityType: ApprovalEntity; entityId: string }) {
  const items = await db.approval.findMany({
    where: { entityType, entityId },
    include: { actor: { select: { name: true, role: { select: { name: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  if (!items.length) return <p className="text-sm text-muted">Belum ada tindakan direkodkan.</p>;
  return (
    <ol className="relative">
      {items.map((a, i) => (
        <li key={a.id} className="relative flex gap-4 pb-5 last:pb-0">
          {i < items.length - 1 && <span className="absolute left-[5px] top-4 bottom-0 w-px bg-line" aria-hidden />}
          <span className={clsx("relative mt-1.5 size-[11px] shrink-0 rounded-full ring-4 ring-white", DOT[a.action])} aria-hidden />
          <div className="min-w-0">
            <p className="text-[0.93rem]">
              <b>{APPROVAL_ACTION[a.action]}</b> <span className="text-muted">oleh</span> <b>{a.actor.name}</b>
            </p>
            <p className="text-[0.8rem] text-muted">{STAGE_LABEL[a.stage] ?? a.stage}, {a.actor.role.name}, {fmtDateTime(a.createdAt)}</p>
            {a.note && <p className="mt-1.5 rounded-[6px] bg-paper px-3 py-2 text-sm">{a.note}</p>}
          </div>
        </li>
      ))}
    </ol>
  );
}
