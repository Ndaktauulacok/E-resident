"use client";

import { useActionState, useState } from "react";
import { loginAction } from "./actions";
import { Alert, SubmitButton } from "@/components/forms";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, null);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <label className="field-label" htmlFor="username">Nama pengguna</label>
        <input id="username" name="username" className="input !h-12 text-base" autoComplete="username" autoCapitalize="none" required autoFocus />
      </div>
      <div>
        <div className="flex items-baseline justify-between">
          <label className="field-label" htmlFor="password">Kata laluan</label>
          <button type="button" className="text-[0.8rem] font-semibold text-sign" onClick={() => setShow((s) => !s)}>
            {show ? "Sembunyi" : "Tunjuk"}
          </button>
        </div>
        <input id="password" name="password" type={show ? "text" : "password"} className="input !h-12 text-base" autoComplete="current-password" required />
      </div>
      <SubmitButton className="btn btn-primary !h-12 w-full text-base" pendingText="Menyemak…">Log masuk</SubmitButton>
      <p className="text-[0.84rem] text-muted">Terlupa kata laluan? Minta Warden atau pentadbir menjana pautan tetapan semula untuk anda.</p>
    </form>
  );
}
