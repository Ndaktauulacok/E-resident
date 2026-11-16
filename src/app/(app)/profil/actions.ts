"use server";

import { db } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { passwordSchema } from "@/lib/account";
import { guarded, str, UserError } from "@/lib/action";
import { audit } from "@/lib/audit";

export const changePasswordAction = guarded(null, async (user, fd) => {
  const u = await db.user.findUniqueOrThrow({ where: { id: user.id } });
  if (!u.passwordHash || !(await verifyPassword(str(fd, "current"), u.passwordHash))) throw new UserError("Kata laluan semasa tidak betul.");
  const pw = String(fd.get("password") ?? "");
  if (pw !== String(fd.get("confirm") ?? "")) throw new UserError("Kedua-dua kata laluan baharu tidak sama.");
  const p = passwordSchema.safeParse(pw);
  if (!p.success) throw new UserError(p.error.issues[0].message);
  await db.$transaction([
    db.user.update({ where: { id: u.id }, data: { passwordHash: await hashPassword(pw) } }),
    db.session.updateMany({ where: { userId: u.id, revokedAt: null, id: { not: user.sessionId } }, data: { revokedAt: new Date() } }),
  ]);
  await audit(user.id, "KATA_LALUAN_TUKAR", `${u.name} menukar kata laluan`, { entityType: "User", entityId: u.id });
  return { ok: true, message: "Kata laluan ditukar. Sesi pada peranti lain telah ditamatkan." };
});
