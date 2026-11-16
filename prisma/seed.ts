/* Seed data CONTOH (palsu) untuk pembangunan & demo.
 * Semua nama, nombor matrik & telefon adalah rekaan.
 * JANGAN jalankan di production (skrip akan berhenti jika NODE_ENV=production).
 */
import { PrismaClient, type AttendanceStatus, type Gender } from "@prisma/client";
import bcrypt from "bcryptjs";
import { PERMISSIONS, ROLE_KEYS, ROLE_META, ROLE_PERMISSIONS, type RoleKeyT } from "../src/lib/permissions";

const db = new PrismaClient();
const DEMO_PASSWORD = "Demo@1234";

// Rawak boleh diulang (deterministik)
let seed = 20261116;
const rnd = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
const pick = <T,>(a: T[]) => a[Math.floor(rnd() * a.length)];

const LELAKI = ["Aiman", "Haziq", "Danish", "Irfan", "Hakimi", "Syahmi", "Faris", "Amirul", "Luqman", "Zikri", "Adam", "Naufal", "Firdaus", "Iqbal", "Rayyan", "Harith", "Azfar", "Najmi", "Afiq", "Hazwan", "Imran", "Khairul", "Zarif", "Aqil"];
const PEREMPUAN = ["Aisyah", "Nurin", "Damia", "Alya", "Hannah", "Qistina", "Sofea", "Balqis", "Iman", "Nadia", "Syifa", "Humaira", "Insyirah", "Farah", "Zulaikha", "Batrisyia", "Amani", "Dhia", "Hana", "Mawar"];
const BAPA = ["Rahman", "Azmi", "Hashim", "Kamal", "Yusof", "Ismail", "Razak", "Zainal", "Hamid", "Rosli", "Salleh", "Kassim", "Jamal", "Nordin", "Halim", "Ariffin", "Mokhtar", "Sulaiman"];
const SEBAB = ["Pulang bermalam (outing diluluskan)", "Bilik sakit", "Pertandingan luar", "Kecemasan keluarga", "Program kokurikulum"];

function residentName(g: Gender) {
  return g === "LELAKI" ? `${pick(LELAKI)} ${pick(LELAKI)} bin ${pick(BAPA)}` : `${pick(PEREMPUAN)} ${pick(PEREMPUAN)} binti ${pick(BAPA)}`;
}
const phone = () => `01${Math.floor(rnd() * 9) + 1}-${String(Math.floor(rnd() * 9_000_000) + 1_000_000)}`;

const TZ = "Asia/Kuala_Lumpur";
const todayISO = new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
const d = (iso: string) => new Date(`${iso}T00:00:00.000Z`);
const addDays = (iso: string, n: number) => {
  const x = d(iso);
  x.setUTCDate(x.getUTCDate() + n);
  return x.toISOString().slice(0, 10);
};
const at = (iso: string, hhmm: string) => new Date(`${iso}T${hhmm}:00+08:00`);

async function main() {
  if (process.env.NODE_ENV === "production" && !process.env.SEED_FORCE) {
    throw new Error("Seed demo tidak dibenarkan di production.");
  }
  console.log("› Mengosongkan data lama…");
  await db.$transaction([
    db.notification.deleteMany(), db.auditLog.deleteMany(), db.approval.deleteMany(),
    db.attendanceAmendment.deleteMany(), db.attendanceRecord.deleteMany(), db.attendanceReport.deleteMany(),
    db.residentRegistration.deleteMany(), db.residentHistory.deleteMany(), db.disciplineRecord.deleteMany(),
    db.hygieneInspection.deleteMany(), db.maintenanceAssignment.deleteMany(), db.complaint.deleteMany(),
    db.announcement.deleteMany(), db.organizationMember.deleteMany(), db.wardenSchedule.deleteMany(),
    db.wardenAssignment.deleteMany(), db.resident.deleteMany(), db.dorm.deleteMany(), db.block.deleteMany(),
    db.session.deleteMany(), db.accountToken.deleteMany(), db.loginAttempt.deleteMany(), db.userPermission.deleteMany(),
    db.user.deleteMany(), db.rolePermission.deleteMany(), db.permission.deleteMany(), db.role.deleteMany(),
    db.systemSetting.deleteMany(),
  ]);

  console.log("› Role & permission…");
  const perms: Record<string, string> = {};
  for (const [key, p] of Object.entries(PERMISSIONS)) {
    perms[key] = (await db.permission.create({ data: { key, module: p.module, description: p.description } })).id;
  }
  const roles = {} as Record<RoleKeyT, string>;
  for (const key of ROLE_KEYS) {
    const m = ROLE_META[key];
    const r = await db.role.create({ data: { key, name: m.name, rank: m.rank, description: m.description } });
    roles[key] = r.id;
    await db.rolePermission.createMany({ data: ROLE_PERMISSIONS[key].map((p) => ({ roleId: r.id, permissionId: perms[p] })) });
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const mkUser = (username: string, name: string, role: RoleKeyT, extra: { phone?: string; email?: string } = {}) =>
    db.user.create({ data: { username, name, roleId: roles[role], passwordHash, status: "ACTIVE", phone: extra.phone ?? phone(), email: extra.email } });

  console.log("› Staf…");
  const admin = await mkUser("admin", "Pentadbir Sistem", "ADMIN", { email: "admin@contoh.edu.my" });
  const kw = await mkUser("ketuawarden", "En. Hafiz Rahman", "KETUA_WARDEN");
  const w1 = await mkUser("warden1", "Pn. Salmah Idris", "WARDEN");
  const w2 = await mkUser("warden2", "En. Kamarul Azmi", "WARDEN");
  const w3 = await mkUser("warden3", "Cik Nurul Aina", "WARDEN");

  console.log("› Blok & dorm…");
  const blockDefs = [
    { code: "A", name: "Teratai", gender: "LELAKI" as Gender },
    { code: "B", name: "Cempaka", gender: "LELAKI" as Gender },
    { code: "C", name: "Melur", gender: "PEREMPUAN" as Gender },
  ];
  const blocks = [];
  for (const b of blockDefs) {
    const block = await db.block.create({ data: { code: b.code, name: b.name, gender: b.gender, description: `Asrama ${b.gender === "LELAKI" ? "lelaki" : "perempuan"}` } });
    const dorms = [];
    for (const code of ["101", "102", "201", "202"]) {
      dorms.push(await db.dorm.create({ data: { blockId: block.id, code: `${b.code}-${code}`, floor: Number(code[0]), capacity: code.endsWith("01") ? 10 : 8 } }));
    }
    blocks.push({ ...block, dorms });
  }
  await db.wardenAssignment.createMany({
    data: [
      { wardenUserId: w1.id, blockId: blocks[0].id }, { wardenUserId: w1.id, blockId: blocks[1].id },
      { wardenUserId: w2.id, blockId: blocks[2].id }, { wardenUserId: w3.id, blockId: blocks[0].id },
    ],
  });

  console.log("› Penghuni…");
  let matric = 1;
  const residentsByDorm: Record<string, { id: string; name: string }[]> = {};
  const allDorms = blocks.flatMap((b) => b.dorms.map((dm) => ({ ...dm, gender: b.gender, blockCode: b.code })));
  for (const dm of allDorms) {
    const n = 5 + Math.floor(rnd() * 3); // 5–7, beri ruang untuk pendaftaran baharu
    residentsByDorm[dm.id] = [];
    for (let i = 0; i < n; i++) {
      const name = residentName(dm.gender);
      const r = await db.resident.create({
        data: {
          matricNo: `KV25-${String(matric++).padStart(4, "0")}`, fullName: name, gender: dm.gender, phone: phone(),
          dormId: dm.id, status: "AKTIF", registeredAt: at(addDays(todayISO, -120), "09:00"),
        },
      });
      await db.residentHistory.create({ data: { residentId: r.id, action: "DAFTAR", toDormId: dm.id, note: "Pendaftaran awal sesi", byUserId: admin.id, createdAt: at(addDays(todayISO, -120), "09:00") } });
      residentsByDorm[dm.id].push({ id: r.id, name });
    }
  }

  // Kepimpinan pelajar — akaun dipautkan kepada rekod penghuni
  const link = async (dormId: string, idx: number, username: string, role: RoleKeyT) => {
    const r = residentsByDorm[dormId][idx];
    const u = await mkUser(username, r.name, role);
    await db.resident.update({ where: { id: r.id }, data: { userId: u.id } });
    return u;
  };
  const [A, B, C] = blocks;
  const ka = await link(A.dorms[2].id, 1, "ketuaasrama", "KETUA_ASRAMA");
  await link(C.dorms[2].id, 1, "penketuaasrama", "PEN_KETUA_ASRAMA");
  const blockHeads: Record<string, string> = {};
  for (const [i, b] of blocks.entries()) {
    const kb = await link(b.dorms[3].id, 1, `kb.${b.code.toLowerCase()}`, "KETUA_BLOK");
    const pkb = await link(b.dorms[2].id, 2, `pkb.${b.code.toLowerCase()}`, "PEN_KETUA_BLOK");
    await db.block.update({ where: { id: b.id }, data: { headUserId: kb.id, assistantUserId: pkb.id } });
    blockHeads[b.id] = kb.id;
    if (i === 0) {
      // Contoh kebenaran tambahan: Penolong Ketua Blok A diberi kuasa menyemak laporan kehadiran
      await db.userPermission.createMany({
        data: ["attendance.review.block", "approvals.view"].map((p) => ({ userId: pkb.id, permissionId: perms[p], grantedById: kw.id })),
      });
    }
  }
  const dormHeads: Record<string, string> = {};
  for (const dm of allDorms) {
    const slug = dm.code.replace("-", "").toLowerCase();
    const kd = await link(dm.id, 0, `kd.${slug}`, "KETUA_DORM");
    dormHeads[dm.id] = kd.id;
    let pkdId: string | null = null;
    if (dm.code === "A-101") {
      const pkd = await link(dm.id, 3, "pkd.a101", "PEN_KETUA_DORM");
      pkdId = pkd.id;
      await db.userPermission.createMany({ data: ["attendance.submit", "approvals.view"].map((p) => ({ userId: pkd.id, permissionId: perms[p], grantedById: kw.id })) });
    }
    await db.dorm.update({ where: { id: dm.id }, data: { headUserId: kd.id, assistantUserId: pkdId } });
  }
  const pelajar = await link(A.dorms[0].id, 2, "pelajar", "PENGHUNI");

  console.log("› Pendaftaran tertunda…");
  const pending = [
    { dorm: A.dorms[0], status: "MENUNGGU_KETUA_BLOK" as const, g: "LELAKI" as Gender },
    { dorm: C.dorms[1], status: "MENUNGGU_WARDEN" as const, g: "PEREMPUAN" as Gender },
    { dorm: B.dorms[2], status: "MENUNGGU_KETUA_BLOK" as const, g: "LELAKI" as Gender },
  ];
  for (const p of pending) {
    const r = await db.resident.create({ data: { matricNo: `KV25-${String(matric++).padStart(4, "0")}`, fullName: residentName(p.g), gender: p.g, phone: phone(), dormId: p.dorm.id, status: "MENUNGGU_PENDAFTARAN" } });
    const reg = await db.residentRegistration.create({ data: { residentId: r.id, status: p.status, submittedById: dormHeads[p.dorm.id], submittedAt: at(addDays(todayISO, -1), "21:40") } });
    await db.residentHistory.create({ data: { residentId: r.id, action: "DAFTAR", toDormId: p.dorm.id, note: "Permohonan pendaftaran & akaun login", byUserId: dormHeads[p.dorm.id] } });
    await db.approval.create({ data: { entityType: "RESIDENT_REGISTRATION", entityId: reg.id, stage: "DORM", action: "HANTAR", actorId: dormHeads[p.dorm.id], createdAt: at(addDays(todayISO, -1), "21:40") } });
    if (p.status === "MENUNGGU_WARDEN") {
      await db.approval.create({ data: { entityType: "RESIDENT_REGISTRATION", entityId: reg.id, stage: "KETUA_BLOK", action: "LULUS", actorId: blockHeads[p.dorm.blockId], note: "Maklumat lengkap.", createdAt: at(todayISO, "07:30") } });
    }
  }

  console.log("› Laporan kehadiran 7 hari…");
  const hourNow = Number(new Intl.DateTimeFormat("en-GB", { timeZone: TZ, hour: "2-digit", hour12: false }).format(new Date()));
  for (let back = 7; back >= 0; back--) {
    const iso = addDays(todayISO, -back);
    for (const session of ["PAGI", "MALAM"] as const) {
      if (back === 0 && session === "MALAM" && hourNow < 21) continue;
      for (const [i, dm] of allDorms.entries()) {
        let status: AttendanceStatus = "SELESAI";
        if (back === 0) {
          if (i % 4 === 3) continue; // belum hantar
          status = (["MENUNGGU_KETUA_BLOK", "MENUNGGU_WARDEN", "SELESAI", "PERLU_PEMBETULAN"] as AttendanceStatus[])[i % 4 === 2 && i > 6 ? 3 : i % 3];
        } else if (back === 1 && session === "MALAM" && i % 5 === 0) status = "MENUNGGU_WARDEN";

        const residents = residentsByDorm[dm.id];
        const absentN = rnd() < 0.55 ? 0 : rnd() < 0.7 ? 1 : 2;
        const absent = new Set<number>();
        while (absent.size < absentN) absent.add(Math.floor(rnd() * residents.length));
        const submitter = dormHeads[dm.id];
        const subAt = at(iso, session === "PAGI" ? `06:${String(30 + Math.floor(rnd() * 25)).padStart(2, "0")}` : `22:${String(Math.floor(rnd() * 30)).padStart(2, "0")}`);
        const report = await db.attendanceReport.create({
          data: {
            dormId: dm.id, date: d(iso), session, status, submittedById: submitter, submittedAt: subAt,
            registeredCount: residents.length, presentCount: residents.length - absent.size, absentCount: absent.size,
            records: { create: residents.map((r, idx) => ({ residentId: r.id, present: !absent.has(idx), reason: absent.has(idx) ? pick(SEBAB) : null })) },
          },
        });
        const trail: { stage: string; action: "HANTAR" | "LULUS" | "KEMBALIKAN"; actorId: string; note?: string; mins: number }[] = [
          { stage: "DORM", action: "HANTAR", actorId: submitter, mins: 0 },
        ];
        if (["MENUNGGU_WARDEN", "SELESAI"].includes(status)) trail.push({ stage: "KETUA_BLOK", action: "LULUS", actorId: blockHeads[dm.blockId], mins: 20 });
        if (status === "SELESAI") trail.push({ stage: "WARDEN", action: "LULUS", actorId: dm.blockCode === "C" ? w2.id : w1.id, mins: 55, note: "Disemak." });
        if (status === "PERLU_PEMBETULAN") trail.push({ stage: "KETUA_BLOK", action: "KEMBALIKAN", actorId: blockHeads[dm.blockId], mins: 15, note: "Sebab tidak hadir tidak lengkap. Sila semak semula." });
        await db.approval.createMany({
          data: trail.map((t) => ({ entityType: "ATTENDANCE_REPORT" as const, entityId: report.id, stage: t.stage, action: t.action, actorId: t.actorId, note: t.note, createdAt: new Date(subAt.getTime() + t.mins * 60_000) })),
        });
      }
    }
  }

  console.log("› Jadual Warden…");
  const monday = (() => {
    const x = d(todayISO);
    return addDays(todayISO, -((x.getUTCDay() + 6) % 7));
  })();
  const wardens = [w1, w2, w3, kw];
  for (let wk = 0; wk < 2; wk++) {
    for (let i = 0; i < 7; i++) {
      const iso = addDays(monday, wk * 7 + i);
      const a = wardens[(i + wk) % 4];
      const b = wardens[(i + wk + 1) % 4];
      await db.wardenSchedule.create({ data: { wardenUserId: a.id, date: d(iso), startTime: "08:00", endTime: "17:00", location: "Pejabat Warden", createdById: kw.id } });
      await db.wardenSchedule.create({ data: { wardenUserId: b.id, date: d(iso), startTime: "20:00", endTime: "23:59", location: i % 2 ? "Pondok Pengawal Blok C" : "Pondok Pengawal Blok A", notes: i === 4 ? "Rondaan selepas solat Jumaat malam" : null, createdById: kw.id } });
    }
  }

  console.log("› Tetapan sistem…");
  await db.systemSetting.createMany({
    data: [
      { key: "system.name", value: "E-RESIDENT" },
      { key: "institution.name", value: "Kolej Vokasional Sungai Petani 1" },
      { key: "hostel.name", value: "Asrama Kolej" },
      { key: "attendance.sessions", value: { PAGI: { open: "06:00", close: "08:00" }, MALAM: { open: "21:30", close: "23:00" } } },
      { key: "security.sessionHours", value: 8 },
    ],
  });

  await db.auditLog.createMany({
    data: [
      { userId: admin.id, action: "SEED", summary: "Data contoh dimuatkan untuk pembangunan" },
      { userId: kw.id, action: "PERMISSION_GRANT", entityType: "User", summary: "Memberi kuasa semakan kehadiran kepada Penolong Ketua Blok A" },
    ],
  });
  await db.notification.createMany({
    data: [
      { userId: pelajar.id, title: "Akaun anda telah diaktifkan", body: "Selamat datang ke E-RESIDENT.", link: "/dashboard" },
      { userId: ka.id, title: "Jadual bertugas Warden minggu ini telah dikemas kini", link: "/dashboard" },
    ],
  });

  const counts = await Promise.all([db.resident.count(), db.attendanceReport.count(), db.user.count()]);
  console.log(`✓ Selesai: ${counts[0]} penghuni, ${counts[1]} laporan kehadiran, ${counts[2]} akaun. Kata laluan demo: ${DEMO_PASSWORD}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
