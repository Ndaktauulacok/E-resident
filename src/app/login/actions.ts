"use server";

import { redirect } from "next/navigation";
import { performLogin } from "@/lib/login";
import type { ActionState } from "@/lib/action";

export async function loginAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  const res = await performLogin(fd, "umum");
  if ("error" in res) return { error: res.error };
  redirect("/dashboard");
}
