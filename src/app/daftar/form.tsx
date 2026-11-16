"use client";

import { useActionState, useState } from "react";
import { IdCard, UserRound, Phone, KeyRound, CheckCircle2 } from "lucide-react";
import { signupAction } from "./actions";
import { Alert, SubmitButton } from "@/components/forms";

/** Format IC semasa menaip: 060101-02-1234 */
function formatIc(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 12);
  return [d.slice(0, 6), d.slice(6, 8), d.slice(8, 12)].filter(Boolean).join("-");
}

export function SignupForm() {
  const [state, action] = useActionState(signupAction, null);
  const [ic, setIc] = useState("");
  const digits = ic.replace(/\D/g, "");
  const complete = digits.length === 12;

  return (
    <form action={action} className="space-y-4">
      {state?.error && <Alert tone="error">{state.error}</Alert>}
      <div>
        <label className="field-label" htmlFor="name">Nama penuh</label>
        <div className="relative">
          <UserRound size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet" aria-hidden />
          <input id="name" name="name" className="input !h-12 pl-11 text-base" placeholder="Seperti dalam kad pengenalan" autoComplete="name" required minLength={3} maxLength={120} />
        </div>
      </div>
      <div>
        <label className="field-label" htmlFor="ic">No. kad pengenalan (IC)</label>
        <div className="relative">
          <IdCard size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet" aria-hidden />
          <input
            id="ic" name="ic" inputMode="numeric" className="input !h-12 pl-11 font-semibold tracking-wider text-base"
            placeholder="060101-02-1234" value={ic} onChange={(e) => setIc(formatIc(e.target.value))} required
          />
          {complete && <CheckCircle2 size={20} className="pop absolute right-3.5 top-1/2 -translate-y-1/2 text-ok" aria-label="Lengkap" />}
        </div>
        <p className="field-hint">Ini akan menjadi nama pengguna anda.</p>
      </div>
      <div>
        <label className="field-label" htmlFor="phone">No. telefon <span className="font-normal text-faint">(pilihan)</span></label>
        <div className="relative">
          <Phone size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-violet" aria-hidden />
          <input id="phone" name="phone" inputMode="tel" className="input !h-12 pl-11 text-base" placeholder="012-3456789" autoComplete="tel" />
        </div>
      </div>

      {/* Pratonton kelayakan log masuk */}
      <div className="rounded-2xl bg-gradient-to-br from-navy-50 via-navy-50 to-flame-50 p-4 ring-1 ring-navy-100">
        <p className="text-xs font-bold uppercase tracking-wider text-sign">Maklumat log masuk anda</p>
        <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted">Nama pengguna</p>
            <p className="font-display text-lg font-bold tracking-wide">{digits || "············"}</p>
          </div>
          <div>
            <p className="flex items-center gap-1 text-muted"><KeyRound size={13} /> Kata laluan</p>
            <p className="font-display text-lg font-bold tracking-[.3em]">{complete ? digits.slice(-4) : "····"}</p>
          </div>
        </div>
      </div>

      <label className="flex items-start gap-2.5 text-sm text-muted">
        <input type="checkbox" name="agree" className="mt-0.5 size-4 accent-[#c2410c]" required />
        Saya mengesahkan maklumat ini adalah benar dan milik saya.
      </label>
      <SubmitButton className="btn btn-primary shine !h-12 w-full text-base" pendingText="Mendaftar…" disabled={!complete}>Daftar sekarang</SubmitButton>
    </form>
  );
}
