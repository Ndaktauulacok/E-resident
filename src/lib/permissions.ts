// Sumber tunggal permission matrix E-RESIDENT.
// Seed membaca fail ini untuk mengisi jadual Role, Permission & RolePermission.
// Semakan sebenar dibuat di server berdasarkan data dalam pangkalan data.

export const ROLE_KEYS = [
  "ADMIN",
  "KETUA_WARDEN",
  "WARDEN",
  "KETUA_ASRAMA",
  "PEN_KETUA_ASRAMA",
  "KETUA_BLOK",
  "PEN_KETUA_BLOK",
  "KETUA_DORM",
  "PEN_KETUA_DORM",
  "PENGHUNI",
] as const;
export type RoleKeyT = (typeof ROLE_KEYS)[number];

export const ROLE_META: Record<RoleKeyT, { name: string; rank: number; description: string }> = {
  ADMIN: { name: "Admin", rank: 1, description: "Akses penuh sistem" },
  KETUA_WARDEN: { name: "Ketua Warden", rank: 1, description: "Akses penuh sistem (setara Admin)" },
  WARDEN: { name: "Warden", rank: 2, description: "Pengurusan penghuni & semakan mengikut bidang kuasa blok" },
  KETUA_ASRAMA: { name: "Ketua Asrama", rank: 3, description: "Kepimpinan pelajar — paparan umum" },
  PEN_KETUA_ASRAMA: { name: "Penolong Ketua Asrama", rank: 4, description: "Kepimpinan pelajar — paparan umum" },
  KETUA_BLOK: { name: "Ketua Blok", rank: 5, description: "Semakan peringkat blok sendiri" },
  PEN_KETUA_BLOK: { name: "Penolong Ketua Blok", rank: 6, description: "Membantu Ketua Blok mengikut kebenaran" },
  KETUA_DORM: { name: "Ketua Dorm", rank: 7, description: "Laporan & pendaftaran dorm sendiri" },
  PEN_KETUA_DORM: { name: "Penolong Ketua Dorm", rank: 8, description: "Membantu Ketua Dorm mengikut kebenaran" },
  PENGHUNI: { name: "Penghuni", rank: 9, description: "Pelajar yang tinggal di asrama" },
};

export const PERMISSIONS = {
  "dashboard.view": { module: "Dashboard", description: "Melihat dashboard" },
  "stats.view": { module: "Dashboard", description: "Melihat statistik agregat asrama" },
  "users.manage": { module: "Akaun", description: "Mengurus akaun, role & kebenaran" },
  "blocks.view": { module: "Blok & Dorm", description: "Melihat blok dan dorm dalam skop" },
  "blocks.manage": { module: "Blok & Dorm", description: "Tambah/edit blok & dorm, tetapkan ketua" },
  "residents.view": { module: "Penghuni", description: "Melihat maklumat penghuni dalam skop" },
  "residents.manage": { module: "Penghuni", description: "Edit, pindah & nyahaktif penghuni dalam skop" },
  "residents.register": { module: "Penghuni", description: "Mendaftar penghuni dorm sendiri & mohon akaun" },
  "registration.review.block": { module: "Penghuni", description: "Menyemak pendaftaran (peringkat blok)" },
  "registration.review.warden": { module: "Penghuni", description: "Pengesahan akhir pendaftaran" },
  "attendance.submit": { module: "Kehadiran", description: "Menghantar laporan kehadiran dorm sendiri" },
  "attendance.review.block": { module: "Kehadiran", description: "Menyemak laporan kehadiran (peringkat blok)" },
  "attendance.review.warden": { module: "Kehadiran", description: "Menyemak laporan kehadiran (peringkat Warden)" },
  "attendance.view": { module: "Kehadiran", description: "Melihat laporan kehadiran dalam skop" },
  "attendance.amend.any": { module: "Kehadiran", description: "Meminda laporan yang telah selesai" },
  "monitoring.view": { module: "Kehadiran", description: "Pemantauan kehadiran langsung" },
  "approvals.view": { module: "Semakan", description: "Halaman semakan & pengesahan" },
  "schedule.view": { module: "Jadual Warden", description: "Melihat jadual bertugas Warden" },
  "schedule.manage": { module: "Jadual Warden", description: "Mengurus jadual bertugas Warden" },
  "audit.view": { module: "Audit", description: "Melihat audit log" },
  "settings.manage": { module: "Tetapan", description: "Mengurus tetapan sistem" },
  // Fasa 6 (permission telah ditakrif; modul akan dibina kemudian)
  "org.view": { module: "Carta Organisasi", description: "Melihat carta organisasi" },
  "org.phone.view": { module: "Carta Organisasi", description: "Melihat nombor telefon dalam carta" },
  "org.manage": { module: "Carta Organisasi", description: "Mengurus carta organisasi & direktori Warden" },
  "announcements.view": { module: "Pengumuman", description: "Melihat pengumuman" },
  "announcements.manage": { module: "Pengumuman", description: "Mengurus pengumuman" },
  "complaints.create": { module: "Aduan", description: "Menghantar aduan kerosakan" },
  "complaints.manage": { module: "Aduan", description: "Menyemak & mengurus aduan" },
  "hygiene.submit": { module: "Kebersihan", description: "Pemeriksaan kendiri dorm" },
  "hygiene.review.block": { module: "Kebersihan", description: "Semakan kebersihan (blok)" },
  "hygiene.manage": { module: "Kebersihan", description: "Pemeriksaan rasmi & tindakan susulan" },
  "discipline.report": { module: "Disiplin", description: "Menghantar laporan kejadian" },
  "discipline.manage": { module: "Disiplin", description: "Mengurus rekod disiplin (sulit)" },
  "reports.view": { module: "Laporan", description: "Melihat laporan & analitik" },
  "reports.export": { module: "Laporan", description: "Eksport PDF/Excel" },
} as const;
export type PermissionKey = keyof typeof PERMISSIONS;

const ALL = Object.keys(PERMISSIONS) as PermissionKey[];

export const ROLE_PERMISSIONS: Record<RoleKeyT, PermissionKey[]> = {
  ADMIN: ALL,
  KETUA_WARDEN: ALL,
  WARDEN: [
    "dashboard.view", "stats.view", "blocks.view", "residents.view", "residents.manage",
    "registration.review.warden", "attendance.view", "attendance.review.warden", "monitoring.view",
    "approvals.view", "schedule.view", "org.view", "org.phone.view", "announcements.view",
    "complaints.manage", "hygiene.manage", "discipline.manage", "discipline.report", "reports.view", "reports.export",
  ],
  KETUA_ASRAMA: ["dashboard.view", "stats.view", "org.view", "announcements.view"],
  PEN_KETUA_ASRAMA: ["dashboard.view", "stats.view", "org.view", "announcements.view"],
  KETUA_BLOK: [
    "dashboard.view", "blocks.view", "residents.view", "registration.review.block", "attendance.view",
    "attendance.review.block", "monitoring.view", "approvals.view", "org.view", "announcements.view",
    "complaints.create", "hygiene.review.block", "discipline.report",
  ],
  // Penolong: akses asas sahaja — kuasa semakan/hantar diberi oleh Admin/Ketua Warden melalui kebenaran tambahan
  PEN_KETUA_BLOK: ["dashboard.view", "blocks.view", "residents.view", "attendance.view", "monitoring.view", "org.view", "announcements.view", "complaints.create"],
  KETUA_DORM: [
    "dashboard.view", "residents.view", "residents.register", "attendance.view", "attendance.submit",
    "approvals.view", "org.view", "announcements.view", "complaints.create", "hygiene.submit", "discipline.report",
  ],
  PEN_KETUA_DORM: ["dashboard.view", "residents.view", "attendance.view", "org.view", "announcements.view", "complaints.create"],
  PENGHUNI: ["dashboard.view", "schedule.view", "org.view", "announcements.view", "complaints.create"],
};

/** Kebenaran yang boleh diberikan secara individu kepada role Penolong */
export const GRANTABLE: Partial<Record<RoleKeyT, PermissionKey[]>> = {
  PEN_KETUA_BLOK: ["attendance.review.block", "registration.review.block", "approvals.view", "hygiene.review.block", "discipline.report"],
  PEN_KETUA_DORM: ["attendance.submit", "residents.register", "approvals.view", "hygiene.submit", "discipline.report"],
};

export const FULL_ACCESS_ROLES: RoleKeyT[] = ["ADMIN", "KETUA_WARDEN"];
