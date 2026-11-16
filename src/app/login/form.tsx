"use client";

import { useActionState, useState } from "react";
import { IdCard, KeyRound, Eye, EyeOff } from "lucide-react";
import { loginAction } from "./actions";
import { Alert, SubmitButton } from "@/components/forms";

export function LoginForm() {
  const [state, action] = useActionState(loginAction, null);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <label className="field-label" htmlFor="username">No. IC / Nama pengguna</label>
        <div className="relative">
          <IdCard size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet" aria-hidden />
          <input id="username" name="username" className="input !h-12 pl-11 text-base" placeholder="cth. 060101021234" autoComplete="username" autoCapitalize="none" required autoFocus />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="password">Kata laluan</label>
        <div className="relative">
          <KeyRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet" aria-hidden />
          <input id="password" name="password" type={show ? "text" : "password"} className="input !h-12 px-11 text-base" autoComplete="current-password" required />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-faint hover:text-sign" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyi kata laluan" : "Tunjuk kata laluan"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <SubmitButton className="btn btn-primary shine !h-12 w-full text-base" pendingText="Menyemak…">Log masuk</SubmitButton>
      <p className="text-[0.82rem] text-muted">Staf asrama yang terlupa kata laluan boleh minta Warden atau pentadbir menjana pautan tetapan semula.</p>
    </form>
  );
}
