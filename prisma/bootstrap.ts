/* Persediaan production (selamat dijalankan berulang kali, TIDAK memasukkan data contoh):
 *   1. Menyegerakkan role, permission & permission matrix daripada src/lib/permissions.ts
 *   2. Mencipta tetapan sistem asas jika belum ada
 *   3. (Pilihan) Mencipta akaun Admin pertama dan memaparkan pautan pengaktifan sekali guna
 *
 * Contoh:
 *   npm run bootstrap
 *   npm run bootstrap -- --admin pentadbir --name "Nama Pentadbir"
 */
import { PrismaClient } from "@prisma/client";
import { createHash, randomBytes } from "crypto";
import { PERMISSIONS, ROLE_KEYS, ROLE_META, ROLE_PERMISSIONS } from "../src/lib/permissions";

const db = new PrismaClient();
const arg = (k: string) => {
  const i = process.argv.indexOf(`--${k}`);
  return i > -1 ? process.argv[i + 1] : undefined;
};

async function main() {
  for (const [key, p] of Object.entries(PERMISSIONS)) {
    await db.permission.upsert({ where: { key }, create: { key, module: p.module, description: p.description }, update: { module: p.module, description: p.description } });
  }
  const perms = new Map((await db.permission.findMany()).map((p) => [p.key, p.id]));
  for (const key of ROLE_KEYS) {
    const m = ROLE_META[key];
    const role = await db.role.upsert({ where: { key }, create: { key, name: m.name, rank: m.rank, description: m.description }, update: { name: m.name, rank: m.rank, description: m.description } });
    await db.rolePermission.deleteMany({ where: { roleId: role.id } });
    await db.rolePermission.createMany({ data: ROLE_PERMISSIONS[key].map((p) => ({ roleId: role.id, permissionId: perms.get(p)! })) });
  }
  console.log(`✓ ${ROLE_KEYS.length} role & ${perms.size} permission disegerakkan`);

  const defaults: [string, unknown][] = [
    ["system.name", "E-RESIDENT"],
    ["institution.name", "Nama Institusi"],
    ["hostel.name", "Asrama"],
    ["attendance.sessions", { PAGI: { open: "06:00", close: "08:00" }, MALAM: { open: "21:30", close: "23:00" } }],
    ["security.sessionHours", 8],
  ];
  for (const [key, value] of defaults) {
    await db.systemSetting.upsert({ where: { key }, create: { key, value: value as never }, update: {} });
  }

  const username = arg("admin")?.toLowerCase();
  if (username) {
    if (!/^[a-z0-9._-]{3,60}$/.test(username)) throw new Error("Nama pengguna tidak sah.");
    if (await db.user.findUnique({ where: { username } })) {
      console.log(`! Akaun ${username} sudah wujud. Gunakan menu Akaun & Role untuk menjana pautan reset.`);
    } else {
      const role = await db.role.findUniqueOrThrow({ where: { key: "ADMIN" } });
      const user = await db.user.create({ data: { username, name: arg("name") ?? "Pentadbir Sistem", roleId: role.id, status: "PENDING_ACTIVATION" } });
      const token = randomBytes(32).toString("base64url");
      await db.accountToken.create({ data: { userId: user.id, type: "ACTIVATION", tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 72 * 3600_000) } });
      await db.auditLog.create({ data: { userId: null, action: "AKAUN_CIPTA", entityType: "User", entityId: user.id, summary: `Akaun Admin pertama ${username} dicipta melalui bootstrap` } });
      const base = (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
      console.log(`✓ Admin ${username} dicipta. Buka pautan ini untuk menetapkan kata laluan (sah 72 jam, sekali guna):\n  ${base}/kata-laluan/${token}`);
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
