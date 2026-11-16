import Link from "next/link";
import { ArrowRight, BellRing, CalendarClock, UserRound } from "lucide-react";
import { db } from "@/lib/db";
import { can, getScope, requireUser, type AuthUser, type Scope } from "@/lib/auth";
import { dateOnly, fmtDate, fmtDateTime, relTime, todayISO } from "@/lib/dates";
import { getQueue, type QueueItem } from "@/lib/queue";
import { getBoard, sessionWindows, windowState } from "@/lib/monitor";
import { headcounts, rateSeries } from "@/lib/stats";
import { ATTENDANCE_STATUS, APPROVAL_ACTION, SESSION_LABEL } from "@/lib/labels";
import { Badge, DL, EmptyState, Panel, Stat } from "@/components/ui";
import { AttendanceRateChart } from "@/components/charts";
import { DormBoard, cellLook } from "@/components/board";
import { KvspLogo } from "@/components/brand";

export const metadata = { title: "Dashboard" };

function greet() {
  const h = Number(new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Kuala_Lumpur", hour: "2-digit", hour12: false }).format(new Date()));
  return h < 12 ? "Selamat pagi" : h < 15 ? "Selamat tengah hari" : h < 19 ? "Selamat petang" : "Selamat malam";
}

function Hello({ user, sub }: { user: AuthUser; sub: string }) {
  return (
    <section className="plate-in relative mb-8 overflow-hidden rounded-[24px] bg-ink px-6 py-7 text-white shadow-[0_25px_50px_-25px_rgba(124,58,237,.7)] sm:px-8">
      <div aria-hidden className="blob absolute -right-10 -top-16 size-64 rounded-full bg-pink-500/40" />
      <div aria-hidden className="blob absolute -bottom-24 left-1/3 size-64 rounded-full bg-cyan-400/30" style={{ animationDelay: "-6s" }} />
      <div aria-hidden className="absolute -right-6 top-1/2 hidden -translate-y-1/2 opacity-90 sm:block">
        <KvspLogo size={190} className="float" />
      </div>
      <div className="relative max-w-[70%]">
        <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-sm font-medium text-white/90 ring-1 ring-white/20">
          <span className="live-dot size-2 rounded-full bg-amber-300" aria-hidden /> {greet()}, {fmtDate(todayISO(), true)}
        </p>
        <h1 className="mt-3 font-display text-[2.2rem] font-bold leading-tight sm:text-[2.8rem]">{user.name}</h1>
        <p className="mt-1 text-white/75">{sub}</p>
      </div>
    </section>
  );
}

function QueuePanel({ items }: { items: QueueItem[] }) {
  return (
    <Panel title="Perlu tindakan anda" actions={items.length > 0 && <Link href="/semakan" className="link text-sm">Lihat semua ({items.length})</Link>} pad={false}>
      {items.length === 0 ? (
        <p className="px-5 py-8 text-center text-muted">Tiada item menunggu tindakan anda.</p>
      ) : (
        <ul className="divide-y divide-line-2">
          {items.slice(0, 6).map((q) => (
            <li key={q.kind + q.id}>
              <Link href={q.href} className="block px-5 py-3 hover:bg-paper">
                <span className="flex items-center justify-between gap-3">
                  <span className="truncate font-semibold">{q.title}</span>
                  <span className="shrink-0 text-[0.78rem] text-faint">{relTime(q.when)}</span>
                </span>
                <span className="text-sm text-muted">{q.place}, {q.next.toLowerCase()}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

async function RecentActivity({ scope }: { scope: Scope }) {
  const reportIds = scope.all
    ? undefined
    : (await db.attendanceReport.findMany({ where: { dormId: { in: scope.dormIds } }, select: { id: true }, orderBy: { date: "desc" }, take: 300 })).map((r) => r.id);
  const items = await db.approval.findMany({
    where: { entityType: "ATTENDANCE_REPORT", ...(reportIds ? { entityId: { in: reportIds } } : {}) },
    include: { actor: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 8,
  });
  const reports = await db.attendanceReport.findMany({ where: { id: { in: items.map((i) => i.entityId) } }, include: { dorm: { select: { code: true } } } });
  const byId = new Map(reports.map((r) => [r.id, r]));
  return (
    <Panel title="Aktiviti terkini" pad={false}>
      {items.length === 0 ? <p className="px-5 py-8 text-center text-muted">Belum ada aktiviti.</p> : (
        <ul className="divide-y divide-line-2">
          {items.map((a) => {
            const r = byId.get(a.entityId);
            return (
              <li key={a.id} className="flex gap-3 px-5 py-3">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-[#b5bccb]" aria-hidden />
                <div className="min-w-0 text-[0.92rem]">
                  <p><b>{a.actor.name}</b> <span className="text-muted">{APPROVAL_ACTION[a.action].toLowerCase()}</span> {r && <Link className="link" href={`/kehadiran/${r.id}`}>laporan {r.dorm.code} {SESSION_LABEL[r.session].toLowerCase()}</Link>}</p>
                  <p className="text-[0.78rem] text-faint">{fmtDateTime(a.createdAt)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

async function TodayStrip({ scope, link = true }: { scope: Scope; link?: boolean }) {
  const today = todayISO();
  const [board, win] = await Promise.all([getBoard(scope, today), sessionWindows()]);
  const dorms = board.flatMap((b) => b.dorms);
  const n = (s: "pagi" | "malam") => dorms.filter((d) => d[s] && d[s]!.status !== "DRAF").length;
  const done = (s: "pagi" | "malam") => dorms.filter((d) => d[s]?.status === "SELESAI").length;
  return (
    <section className="mb-6 overflow-hidden rounded-[12px] bg-ink text-white">
      <div className="grid gap-px bg-white/10 sm:grid-cols-[1.2fr_1fr_1fr]">
        <div className="bg-ink px-6 py-5">
          <p className="text-sm text-white/60">Kehadiran hari ini</p>
          <p className="mt-1 font-display text-[1.9rem] font-bold leading-tight">{fmtDate(today, true)}</p>
          {link && <Link href="/pemantauan" className="btn btn-tag btn-sm mt-3">Buka pemantauan langsung</Link>}
        </div>
        {(["pagi", "malam"] as const).map((s) => {
          const w = windowState(today, s === "pagi" ? win.PAGI : win.MALAM);
          return (
            <div key={s} className="bg-ink px-6 py-5">
              <p className="text-sm text-white/60">Sesi {s} <span className="text-white/40">({(s === "pagi" ? win.PAGI : win.MALAM).open} hingga {(s === "pagi" ? win.PAGI : win.MALAM).close})</span></p>
              <p className="mt-1 font-display text-[2.6rem] font-bold leading-none">{n(s)}<span className="text-white/40">/{dorms.length}</span></p>
              <p className="mt-1.5 text-sm text-white/70">{w === "akan" ? "Sesi belum dibuka" : `${done(s)} selesai disemak, ${dorms.length - n(s)} belum hantar`}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default async function DashboardPage() {
  const user = await requireUser();
  const scope = await getScope(user);
  const r = user.role;

  // ── Penghuni ──
  if (r === "PENGHUNI") return <ResidentDashboard user={user} />;

  // ── Kepimpinan asrama: statistik agregat sahaja ──
  if (r === "KETUA_ASRAMA" || r === "PEN_KETUA_ASRAMA") {
    const all: Scope = { all: true, blockIds: [], dormIds: [] };
    const [hc, series] = await Promise.all([headcounts(all), rateSeries(all)]);
    const last = [...series].reverse().find((p) => p.malam ?? p.pagi);
    return (
      <>
        <Hello user={user} sub={`${user.roleName}. Paparan statistik umum asrama.`} />
        <section className="panel mb-6 grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
          <Stat label="Penghuni aktif" value={hc.residents} />
          <Stat label="Blok" value={hc.blocks} />
          <Stat label="Dorm" value={hc.dorms} />
          <Stat label="Kadar kehadiran terkini" value={last ? `${last.malam ?? last.pagi}%` : "Tiada"} sub={last?.label} />
        </section>
        <Panel title="Kadar kehadiran 7 hari"><AttendanceRateChart data={series} /></Panel>
        <p className="mt-4 text-sm text-muted">Maklumat peribadi penghuni dan rekod disiplin tidak dipaparkan untuk role ini.</p>
      </>
    );
  }

  const queue = can(user, "approvals.view") ? await getQueue(user, scope) : [];

  // ── Ketua Dorm / Penolong ──
  if (r === "KETUA_DORM" || r === "PEN_KETUA_DORM") return <DormDashboard user={user} scope={scope} queue={queue} />;

  // ── Ketua Blok / Penolong ──
  if (r === "KETUA_BLOK" || r === "PEN_KETUA_BLOK") {
    const [board, series, win] = await Promise.all([getBoard(scope, todayISO()), rateSeries(scope), sessionWindows()]);
    const blockNames = board.map((b) => `Blok ${b.code} ${b.name}`).join(", ");
    return (
      <>
        <Hello user={user} sub={`${user.roleName}${blockNames ? `, ${blockNames}` : ""}`} />
        {board.length === 0 ? (
          <div className="panel"><EmptyState title="Anda belum ditetapkan kepada mana-mana blok" desc="Minta Admin atau Ketua Warden menetapkan blok anda." /></div>
        ) : (
          <>
            <TodayStrip scope={scope} />
            <div className="mb-8"><DormBoard blocks={board} wPagi={windowState(todayISO(), win.PAGI)} wMalam={windowState(todayISO(), win.MALAM)} /></div>
            <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
              <Panel title="Kadar kehadiran blok, 7 hari"><AttendanceRateChart data={series} /></Panel>
              {can(user, "approvals.view") ? <QueuePanel items={queue} /> : <RecentActivity scope={scope} />}
            </div>
          </>
        )}
      </>
    );
  }

  // ── Admin, Ketua Warden, Warden ──
  const [hc, series] = await Promise.all([headcounts(scope), rateSeries(scope)]);
  const latestAbsent = await db.attendanceRecord.findMany({
    where: { present: false, report: { date: dateOnly(todayISO()), status: { not: "DRAF" }, ...(scope.all ? {} : { dormId: { in: scope.dormIds } }) } },
    include: { resident: { select: { fullName: true } }, report: { select: { id: true, session: true, dorm: { select: { code: true } } } } },
    orderBy: { report: { session: "desc" } },
    take: 8,
  });
  return (
    <>
      <Hello user={user} sub={scope.all ? `${user.roleName}, akses penuh seluruh asrama` : `${user.roleName}, ${scope.blockIds.length} blok di bawah bidang kuasa anda`} />
      <TodayStrip scope={scope} />
      <section className="panel mb-6 grid grid-cols-2 divide-line md:grid-cols-4 md:divide-x">
        <Stat label="Penghuni aktif" value={hc.residents} href={can(user, "residents.view") ? "/penghuni" : undefined} />
        <Stat label="Blok" value={hc.blocks} href="/blok" />
        <Stat label="Dorm" value={hc.dorms} href="/blok" />
        <Stat label="Warden" value={hc.wardens} sub="Termasuk Ketua Warden" href="/jadual" />
      </section>
      <div className="grid items-start gap-6 lg:grid-cols-[1.6fr_1fr]">
        <Panel title="Kadar kehadiran, 7 hari"><AttendanceRateChart data={series} /></Panel>
        <QueuePanel items={queue} />
        <Panel title="Tidak hadir hari ini" actions={<Link className="link text-sm" href={`/kehadiran?tarikh=${todayISO()}`}>Semua laporan</Link>} pad={false}>
          {latestAbsent.length === 0 ? <p className="px-5 py-8 text-center text-muted">Tiada ketidakhadiran direkodkan setakat ini.</p> : (
            <ul className="divide-y divide-line-2">
              {latestAbsent.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-5 py-2.5">
                  <span><b>{a.resident.fullName}</b> <Link href={`/kehadiran/${a.report.id}`} className="text-sm text-muted hover:underline">{a.report.dorm.code}, {SESSION_LABEL[a.report.session].toLowerCase()}</Link></span>
                  <span className="text-sm">{a.reason}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
        <RecentActivity scope={scope} />
      </div>
    </>
  );
}

async function DormDashboard({ user, scope, queue }: { user: AuthUser; scope: Scope; queue: QueueItem[] }) {
  const dorms = await db.dorm.findMany({
    where: { id: { in: scope.dormIds } },
    include: { block: true, head: { select: { name: true } }, assistant: { select: { name: true } }, _count: { select: { residents: { where: { status: "AKTIF" } } } } },
  });
  if (!dorms.length) {
    return (
      <>
        <Hello user={user} sub={user.roleName} />
        <div className="panel"><EmptyState title="Anda belum ditetapkan kepada mana-mana dorm" desc="Minta Admin atau Ketua Warden menetapkan dorm anda." /></div>
      </>
    );
  }
  const today = todayISO();
  const [win, todaysAll, reports] = await Promise.all([
    sessionWindows(),
    db.attendanceReport.findMany({ where: { dormId: { in: scope.dormIds }, date: dateOnly(today) } }),
    db.attendanceReport.findMany({ where: { dormId: { in: scope.dormIds } }, orderBy: [{ date: "desc" }, { session: "desc" }], take: 6, include: { dorm: { select: { code: true } } } }),
  ]);
  const canSubmit = can(user, "attendance.submit");
  return (
    <>
      <Hello user={user} sub={`${user.roleName}`} />
      {dorms.map((d) => {
        const todays = todaysAll.filter((t) => t.dormId === d.id);
        return (
          <section key={d.id} className="mb-6 grid gap-4 md:grid-cols-[16rem_1fr_1fr]">
            <div className="plate flex flex-col">
              <div className="bg-ink px-5 py-4 text-white">
                <p className="text-sm text-white/60">Dorm anda</p>
                <p className="plate-code text-[3.4rem]">{d.code}</p>
              </div>
              <div className="flex-1 space-y-1 px-5 py-4 text-sm">
                <p>Blok {d.block.code}, {d.block.name}</p>
                <p className="text-muted">{d._count.residents} penghuni aktif, kapasiti {d.capacity}</p>
                <Link href={`/dorm/${d.id}`} className="link">Senarai penghuni</Link>
              </div>
            </div>
            {(["PAGI", "MALAM"] as const).map((s) => {
              const rep = todays.find((t) => t.session === s);
              const w = windowState(today, win[s]);
              const look = cellLook(rep ? { id: rep.id, status: rep.status, present: rep.presentCount, absent: rep.absentCount, registered: rep.registeredCount } : null, w);
              return (
                <div key={s} className="panel flex flex-col p-5">
                  <span className={`h-1.5 w-12 rounded-full ${look.bar}`} aria-hidden />
                  <p className="mt-3 text-sm text-muted">Laporan {SESSION_LABEL[s].toLowerCase()}, {win[s].open} hingga {win[s].close}</p>
                  <p className="font-display text-[1.7rem] font-bold leading-tight">{rep && rep.status !== "DRAF" ? `${rep.presentCount}/${rep.registeredCount} hadir` : look.label}</p>
                  {rep && <div className="mt-2"><Badge tone={ATTENDANCE_STATUS[rep.status].tone}>{ATTENDANCE_STATUS[rep.status].label}</Badge></div>}
                  <div className="mt-auto pt-4">
                    {rep && rep.status !== "DRAF" ? (
                      <Link className="btn btn-ghost btn-sm" href={`/kehadiran/${rep.id}`}>{rep.status === "PERLU_PEMBETULAN" ? "Betulkan laporan" : "Lihat laporan"}</Link>
                    ) : canSubmit && w !== "akan" ? (
                      <Link className="btn btn-tag" href={`/kehadiran/hantar?dorm=${d.id}&session=${s}`}>{rep ? "Sambung draf" : `Hantar laporan ${SESSION_LABEL[s].toLowerCase()}`}</Link>
                    ) : !canSubmit ? (
                      <p className="text-sm text-muted">Anda belum diberi kuasa menghantar laporan.</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </section>
        );
      })}
      <div className="grid gap-6 lg:grid-cols-2">
        {can(user, "approvals.view") && <QueuePanel items={queue} />}
        <Panel title="Laporan terkini dorm" pad={false}>
          {reports.length === 0 ? <p className="px-5 py-8 text-center text-muted">Belum ada laporan.</p> : (
            <ul className="divide-y divide-line-2">
              {reports.map((rp) => (
                <li key={rp.id}>
                  <Link href={`/kehadiran/${rp.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-paper">
                    <span><b>{fmtDate(rp.date)}</b> <span className="text-muted">{SESSION_LABEL[rp.session]}, {rp.presentCount}/{rp.registeredCount}</span></span>
                    <Badge tone={ATTENDANCE_STATUS[rp.status].tone}>{ATTENDANCE_STATUS[rp.status].label}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

async function ResidentDashboard({ user }: { user: AuthUser }) {
  const res = user.residentId
    ? await db.resident.findUnique({ where: { id: user.residentId }, include: { dorm: { include: { block: { include: { head: { select: { name: true } } } }, head: { select: { name: true } } } } } })
    : null;
  const today = todayISO();
  const duty = await db.wardenSchedule.findMany({ where: { date: dateOnly(today) }, include: { warden: { select: { name: true, phone: true } } }, orderBy: { startTime: "asc" } });
  return (
    <>
      <Hello user={user} sub="Penghuni" />
      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        {res ? (
          <section className="plate">
            <div className="flex items-end justify-between bg-ink px-6 py-5 text-white">
              <div>
                <p className="text-sm text-white/60">Bilik anda</p>
                <p className="plate-code text-[3.6rem]">{res.dorm.code}</p>
              </div>
              <p className="pb-1 text-right text-sm text-white/70">Blok {res.dorm.block.code}<br />{res.dorm.block.name}</p>
            </div>
            <div className="p-6">
              <DL items={[
                ["Nama", res.fullName], ["No. matrik", res.matricNo],
                ["Ketua Dorm", res.dorm.head?.name], ["Ketua Blok", res.dorm.block.head?.name],
                ["Tarikh daftar", fmtDate(res.registeredAt)], ["Status", "Aktif"],
              ]} />
            </div>
          </section>
        ) : (
          <div className="panel"><EmptyState title="Akaun anda telah didaftarkan" desc="Warden akan menempatkan anda ke blok dan dorm. Maklumat bilik akan dipaparkan di sini selepas itu." /></div>
        )}
        <Panel title="Warden bertugas hari ini" actions={<Link className="link text-sm" href="/jadual">Jadual minggu ini</Link>} pad={false}>
          {duty.length === 0 ? <p className="px-5 py-8 text-center text-muted">Tiada jadual bertugas direkodkan untuk hari ini.</p> : (
            <ul className="divide-y divide-line-2">
              {duty.map((d) => (
                <li key={d.id} className="flex items-center gap-4 px-5 py-4">
                  <span className="w-44 shrink-0 whitespace-nowrap font-display text-xl font-semibold">{d.startTime}<span className="text-faint"> hingga {d.endTime}</span></span>
                  <span className="min-w-0">
                    <b className="block">{d.warden.name}</b>
                    <span className="text-sm text-muted">{d.location}</span>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
      <QuickLinks />
    </>
  );
}

const QUICK = [
  { href: "/jadual", title: "Jadual Warden", desc: "Semak Warden bertugas minggu ini", icon: CalendarClock, grad: "from-indigo-500 to-violet-500" },
  { href: "/notifikasi", title: "Notifikasi", desc: "Makluman terkini dari pihak asrama", icon: BellRing, grad: "from-pink-500 to-rose-500" },
  { href: "/profil", title: "Profil & Keselamatan", desc: "Kemas kini maklumat dan tukar kata laluan", icon: UserRound, grad: "from-amber-400 to-orange-500" },
];

function QuickLinks() {
  return (
    <section className="mt-6 grid gap-4 sm:grid-cols-3">
      {QUICK.map((q, i) => (
        <Link key={q.href} href={q.href} className="plate-in panel lift group flex items-center gap-4 p-5" style={{ animationDelay: `${150 + i * 80}ms` }}>
          <span className={`flex size-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-110 ${q.grad}`}>
            <q.icon size={22} />
          </span>
          <span className="min-w-0">
            <span className="block font-display text-xl font-bold">{q.title}</span>
            <span className="block text-sm text-muted">{q.desc}</span>
          </span>
          <ArrowRight size={18} className="ml-auto shrink-0 text-faint transition group-hover:translate-x-1 group-hover:text-sign" />
        </Link>
      ))}
    </section>
  );
}
