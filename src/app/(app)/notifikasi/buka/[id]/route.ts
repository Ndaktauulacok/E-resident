import { NextResponse, type NextRequest } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

// Buka notifikasi: tandakan dibaca, kemudian ke pautan berkaitan (hanya notifikasi milik sendiri)
export async function GET(req: NextRequest, ctx: { params: Promise<unknown> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));
  const { id } = (await ctx.params) as { id: string };
  const n = await db.notification.findFirst({ where: { id, userId: user.id } });
  if (n && !n.readAt) await db.notification.update({ where: { id }, data: { readAt: new Date() } });
  const target = n?.link && n.link.startsWith("/") && !n.link.startsWith("//") ? n.link : "/notifikasi";
  return NextResponse.redirect(new URL(target, req.url));
}
