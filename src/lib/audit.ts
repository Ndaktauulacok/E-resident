import "server-only";
import { db } from "./db";
import { clientIp } from "./auth";
import type { Prisma } from "@prisma/client";

export async function audit(
  userId: string | null,
  action: string,
  summary: string,
  opts: { entityType?: string; entityId?: string; meta?: Prisma.InputJsonValue } = {},
) {
  await db.auditLog.create({
    data: { userId, action, summary: summary.slice(0, 500), entityType: opts.entityType, entityId: opts.entityId, meta: opts.meta, ip: await clientIp() },
  });
}

export async function notify(userIds: (string | null | undefined)[], title: string, body?: string, link?: string) {
  const ids = [...new Set(userIds.filter(Boolean) as string[])];
  if (!ids.length) return;
  await db.notification.createMany({ data: ids.map((userId) => ({ userId, title, body, link })) });
}

/** Pengguna blok yang memegang sesuatu kebenaran (Ketua/Penolong Ketua Blok) */
export async function blockLeaders(blockId: string) {
  const b = await db.block.findUnique({ where: { id: blockId }, select: { headUserId: true, assistantUserId: true } });
  return [b?.headUserId, b?.assistantUserId];
}
export async function blockWardens(blockId: string) {
  const w = await db.wardenAssignment.findMany({ where: { blockId }, select: { wardenUserId: true } });
  return w.map((x) => x.wardenUserId);
}
export async function dormLeaders(dormId: string) {
  const d = await db.dorm.findUnique({ where: { id: dormId }, select: { headUserId: true, assistantUserId: true } });
  return [d?.headUserId, d?.assistantUserId];
}
