"use client";

import { useActionState, useState } from "react";
import { UserRound, KeyRound, Eye, EyeOff } from "lucide-react";
import { adminLoginAction } from "./actions";
import { Alert, SubmitButton } from "@/components/forms";

const darkInput = "input !h-12 border-white/15 bg-white/5 text-base text-white placeholder:text-white/35 hover:border-amber-300/60 focus:border-amber-400 focus:!shadow-[0_0_0_4px_rgba(251,191,36,.18)]";

export function AdminLoginForm() {
  const [state, action] = useActionState(adminLoginAction, null);
  const [show, setShow] = useState(false);
  return (
    <form action={action} className="space-y-5">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <label className="field-label !text-white/85" htmlFor="username">Nama pengguna admin</label>
        <div className="relative">
          <UserRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-300" aria-hidden />
          <input id="username" name="username" className={`${darkInput} pl-11`} autoComplete="username" autoCapitalize="none" required autoFocus />
        </div>
      </div>
      <div>
        <label className="field-label !text-white/85" htmlFor="password">Kata laluan</label>
        <div className="relative">
          <KeyRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-300" aria-hidden />
          <input id="password" name="password" type={show ? "text" : "password"} className={`${darkInput} px-11`} autoComplete="current-password" required />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-white/50 hover:text-amber-300" onClick={() => setShow((s) => !s)} aria-label={show ? "Sembunyi kata laluan" : "Tunjuk kata laluan"}>
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>
      <SubmitButton className="btn btn-tag shine !h-12 w-full text-base" pendingText="Mengesahkan…">Masuk ke Panel Admin</SubmitButton>
    </form>
  );
}
