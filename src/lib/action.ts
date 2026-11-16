import "server-only";
import { unstable_rethrow } from "next/navigation";
import { ZodError } from "zod";
import { can, getCurrentUser, type AuthUser } from "./auth";
import type { PermissionKey } from "./permissions";

export type ActionState = { ok?: boolean; error?: string; message?: string } | null;

export class UserError extends Error {}

/** Pembalut server action: sesi, kebenaran (server-side), validasi & ralat */
export function guarded(
  perm: PermissionKey | PermissionKey[] | null,
  fn: (user: AuthUser, fd: FormData) => Promise<ActionState | void>,
) {
  return async (_prev: ActionState, fd: FormData): Promise<ActionState> => {
    try {
      const user = await getCurrentUser();
      if (!user) return { error: "Sesi anda telah tamat. Sila log masuk semula." };
      const perms = perm == null ? [] : Array.isArray(perm) ? perm : [perm];
      if (perms.length && !perms.some((p) => can(user, p)))
        return { error: "Anda tidak mempunyai kebenaran untuk tindakan ini." };
      return (await fn(user, fd)) ?? { ok: true };
    } catch (e) {
      unstable_rethrow(e);
      if (e instanceof UserError) return { error: e.message };
      if (e instanceof ZodError) return { error: e.issues.map((i) => i.message).join(" ") };
      console.error(e);
      return { error: "Ralat sistem berlaku. Cuba sekali lagi atau hubungi pentadbir." };
    }
  };
}

export function str(fd: FormData, k: string) {
  const v = fd.get(k);
  return typeof v === "string" ? v.trim() : "";
}
