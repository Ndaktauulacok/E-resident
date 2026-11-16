import { db } from "@/lib/db";
import { fmtDateTime, relTime } from "@/lib/dates";
import { ConfirmAction } from "./forms";
import { revokeSessionAction } from "@/app/(app)/akaun/actions";

function device(ua: string | null) {
  if (!ua) return "Peranti tidak diketahui";
  const b = /Edg\//.test(ua) ? "Edge" : /Chrome\//.test(ua) ? "Chrome" : /Firefox\//.test(ua) ? "Firefox" : /Safari\//.test(ua) ? "Safari" : "Pelayar";
  const o = /Android/.test(ua) ? "Android" : /iPhone|iPad/.test(ua) ? "iOS" : /Windows/.test(ua) ? "Windows" : /Mac OS/.test(ua) ? "macOS" : /Linux/.test(ua) ? "Linux" : "";
  return `${b}${o ? ` di ${o}` : ""}`;
}

export async function SessionList({ userId, currentSessionId }: { userId: string; currentSessionId?: string }) {
  const sessions = await db.session.findMany({ where: { userId, revokedAt: null, expiresAt: { gt: new Date() } }, orderBy: { lastSeenAt: "desc" } });
  if (!sessions.length) return <p className="text-sm text-muted">Tiada sesi aktif.</p>;
  return (
    <ul className="divide-y divide-line-2">
      {sessions.map((s) => (
        <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
          <div>
            <p className="font-semibold">{device(s.userAgent)}{s.id === currentSessionId && <span className="ml-2 text-sm font-medium text-ok">Sesi ini</span>}</p>
            <p className="text-sm text-muted">Log masuk {fmtDateTime(s.createdAt)}, aktif {relTime(s.lastSeenAt)}, IP {s.ip}</p>
          </div>
          <ConfirmAction action={revokeSessionAction} fields={{ sessionId: s.id }} tone="ghost" size="sm" label="Tamatkan" title="Tamatkan sesi ini?" body={s.id === currentSessionId ? "Anda akan dilog keluar daripada peranti ini." : "Peranti tersebut perlu log masuk semula."} confirmLabel="Tamatkan sesi" />
        </li>
      ))}
    </ul>
  );
}
