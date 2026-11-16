"use client";

import { useActionState } from "react";
import { setPasswordAction } from "./actions";
import { Alert, SubmitButton } from "@/components/forms";

export function SetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(setPasswordAction, null);
  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="token" value={token} />
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <label className="field-label" htmlFor="password">Kata laluan baharu</label>
        <input id="password" name="password" type="password" className="input" autoComplete="new-password" required minLength={10} />
        <p className="field-hint">Sekurang-kurangnya 10 aksara, mengandungi huruf dan nombor.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="confirm">Taip semula kata laluan</label>
        <input id="confirm" name="confirm" type="password" className="input" autoComplete="new-password" required />
      </div>
      <SubmitButton className="btn btn-primary w-full">Simpan kata laluan</SubmitButton>
    </form>
  );
}
