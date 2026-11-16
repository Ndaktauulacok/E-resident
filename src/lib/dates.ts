// Semua tarikh operasi asrama mengikut waktu Malaysia (UTC+8)
export const TZ = "Asia/Kuala_Lumpur";

/** 'YYYY-MM-DD' bagi hari ini di Malaysia */
export function todayISO(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}
/** Tarikh (lajur @db.Date) — disimpan sebagai tengah malam UTC */
export function dateOnly(iso: string) {
  return new Date(`${iso}T00:00:00.000Z`);
}
export function isoOf(d: Date) {
  return d.toISOString().slice(0, 10);
}
export function addDays(iso: string, n: number) {
  const d = dateOnly(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return isoOf(d);
}
/** Isnin bagi minggu yang mengandungi tarikh */
export function mondayOf(iso: string) {
  const d = dateOnly(iso);
  const dow = (d.getUTCDay() + 6) % 7;
  return addDays(iso, -dow);
}
export function currentHourMY(now = new Date()) {
  return Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(now));
}

const HARI = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
const BULAN = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
const BULAN_PENUH = ["Januari", "Februari", "Mac", "April", "Mei", "Jun", "Julai", "Ogos", "September", "Oktober", "November", "Disember"];

export function dayName(iso: string) {
  return HARI[dateOnly(iso).getUTCDay()];
}
export function fmtDate(d: Date | string, long = false) {
  const iso = typeof d === "string" ? d : isoOf(d);
  const x = dateOnly(iso);
  return `${x.getUTCDate()} ${(long ? BULAN_PENUH : BULAN)[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
}
export function fmtDateTime(d: Date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, day: "numeric", month: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${BULAN[Number(get("month")) - 1]} ${get("year")}, ${get("hour")}:${get("minute")}`;
}
export function fmtTime(d: Date) {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false }).format(d);
}
export function relTime(d: Date, now = new Date()) {
  const s = Math.round((now.getTime() - d.getTime()) / 1000);
  if (s < 60) return "baru sahaja";
  if (s < 3600) return `${Math.floor(s / 60)} minit lalu`;
  if (s < 86400) return `${Math.floor(s / 3600)} jam lalu`;
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} hari lalu`;
  return fmtDate(d);
}
