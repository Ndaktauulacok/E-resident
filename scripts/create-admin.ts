// Cipta / kemas kini akaun admin khas yang log masuk melalui Portal Admin.
// Guna: npx tsx scripts/create-admin.ts --username adminkvsp1 --password "KataLaluanKuat" [--name "Pentadbir KVSP1"]
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

function arg(name: string) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function main() {
  const username = arg("username")?.trim().toLowerCase();
  const password = arg("password");
  const name = arg("name") ?? "Pentadbir KVSP1";
  if (!username || !password) throw new Error("Perlu --username dan --password");
  if (password.length < 10) throw new Error("Kata laluan admin mesti sekurang-kurangnya 10 aksara");

  const role = await db.role.findUnique({ where: { key: "ADMIN" } });
  if (!role) throw new Error("Role ADMIN tiada. Jalankan seed/bootstrap dahulu.");

  const passwordHash = await bcrypt.hash(password, 12);
  const user = await db.user.upsert({
    where: { username },
    update: { passwordHash, status: "ACTIVE", roleId: role.id, name },
    create: { username, name, passwordHash, status: "ACTIVE", roleId: role.id },
  });
  await db.auditLog.create({ data: { userId: user.id, action: "ADMIN_KHAS", summary: `Akaun admin khas "${username}" dicipta/dikemas kini` } });
  console.log(`✓ Akaun admin "${username}" sedia. Log masuk di /admin-login`);
}

main()
  .catch((e) => {
    console.error(e.message ?? e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
