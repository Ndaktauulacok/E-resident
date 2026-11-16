// Label Bahasa Melayu & nada warna untuk status
export type Tone = "neutral" | "info" | "warn" | "danger" | "ok" | "ink";

export const ATTENDANCE_STATUS: Record<string, { label: string; tone: Tone }> = {
  DRAF: { label: "Draf", tone: "neutral" },
  MENUNGGU_KETUA_BLOK: { label: "Menunggu Semakan Ketua Blok", tone: "info" },
  PERLU_PEMBETULAN: { label: "Perlu Pembetulan", tone: "danger" },
  DILULUSKAN_KETUA_BLOK: { label: "Diluluskan Ketua Blok", tone: "info" },
  MENUNGGU_WARDEN: { label: "Menunggu Semakan Warden", tone: "warn" },
  SELESAI: { label: "Selesai", tone: "ok" },
};

export const REGISTRATION_STATUS: Record<string, { label: string; tone: Tone }> = {
  MENUNGGU_KETUA_BLOK: { label: "Menunggu Semakan Ketua Blok", tone: "info" },
  MENUNGGU_WARDEN: { label: "Menunggu Pengesahan Warden", tone: "warn" },
  PERLU_PEMBETULAN: { label: "Perlu Pembetulan", tone: "danger" },
  DILULUSKAN: { label: "Diluluskan", tone: "ok" },
  DITOLAK: { label: "Ditolak", tone: "neutral" },
};

export const RESIDENT_STATUS: Record<string, { label: string; tone: Tone }> = {
  MENUNGGU_PENDAFTARAN: { label: "Menunggu Pendaftaran", tone: "warn" },
  AKTIF: { label: "Aktif", tone: "ok" },
  TIDAK_AKTIF: { label: "Tidak Aktif", tone: "neutral" },
  DITOLAK: { label: "Ditolak", tone: "neutral" },
};

export const USER_STATUS: Record<string, { label: string; tone: Tone }> = {
  PENDING_ACTIVATION: { label: "Belum Diaktifkan", tone: "warn" },
  ACTIVE: { label: "Aktif", tone: "ok" },
  INACTIVE: { label: "Dinyahaktifkan", tone: "neutral" },
};

export const SESSION_LABEL: Record<string, string> = { PAGI: "Pagi", MALAM: "Malam" };

export const APPROVAL_ACTION: Record<string, string> = {
  HANTAR: "Dihantar",
  LULUS: "Diluluskan",
  KEMBALIKAN: "Dikembalikan untuk pembetulan",
  TOLAK: "Ditolak",
  PINDA: "Dipinda",
};

export const STAGE_LABEL: Record<string, string> = {
  DORM: "Dorm",
  KETUA_BLOK: "Ketua Blok",
  WARDEN: "Warden",
  ADMIN: "Pentadbir",
};
