"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { destroySession, getCurrentUser } from "@/lib/auth";
import { audit } from "@/lib/audit";

export async function logoutAction() {
  const user = await getCurrentUser();
  if (user) await audit(user.id, "LOGOUT", `${user.name} log keluar`);
  await destroySession();
  redirect("/login");
}

export async function markAllReadAction() {
  const user = await getCurrentUser();
  if (!user) return;
  await db.notification.updateMany({ where: { userId: user.id, readAt: null }, data: { readAt: new Date() } });
  revalidatePath("/", "layout");
}
