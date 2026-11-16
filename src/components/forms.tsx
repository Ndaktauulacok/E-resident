"use client";

import { useActionState, useEffect, useId, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import clsx from "clsx";

export type ActionState = { ok?: boolean; error?: string; message?: string; link?: string } | null;
type Action = (prev: ActionState, fd: FormData) => Promise<ActionState>;

export function SubmitButton({ children, className = "btn btn-primary", pendingText = "Menyimpan…", ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement> & { pendingText?: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={className} disabled={pending || rest.disabled} aria-busy={pending} {...rest}>
      {pending && <Spinner />}
      {pending ? pendingText : children}
    </button>
  );
}

export function Spinner() {
  return <span className="size-4 animate-spin rounded-full border-2 border-current border-r-transparent" aria-hidden />;
}

export function Alert({ tone, children }: { tone: "error" | "ok"; children: React.ReactNode }) {
  return (
    <div role={tone === "error" ? "alert" : "status"} className={clsx("rounded-[6px] border px-4 py-3 text-sm", tone === "error" ? "border-[#efc4ca] bg-danger-soft text-[#8f1f2e]" : "border-[#b9dfc9] bg-ok-soft text-[#145c3b]")}>
      {children}
    </div>
  );
}

export function SecretLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <code className="max-w-full break-all rounded bg-white/70 px-2 py-1 text-xs text-ink">{link}</code>
      <button type="button" className="btn btn-ghost btn-sm" onClick={() => navigator.clipboard.writeText(link).then(() => setCopied(true))}>
        {copied ? "Disalin" : "Salin pautan"}
      </button>
    </div>
  );
}

/** Borang server action dengan paparan ralat/kejayaan dan keadaan loading */
export function ActionForm({ action, children, className, resetOnSuccess, refresh = true }: { action: Action; children: React.ReactNode; className?: string; resetOnSuccess?: boolean; refresh?: boolean }) {
  const [state, formAction] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state?.ok) {
      if (resetOnSuccess) ref.current?.reset();
      if (refresh) router.refresh();
    }
  }, [state, resetOnSuccess, refresh, router]);
  return (
    <form ref={ref} action={formAction} className={className}>
      {state?.error && <div className="mb-4"><Alert tone="error">{state.error}</Alert></div>}
      {state?.ok && state.message && (
        <div className="mb-4">
          <Alert tone="ok">
            {state.message}
            {state.link && <SecretLink link={state.link} />}
          </Alert>
        </div>
      )}
      {children}
    </form>
  );
}

/** Butang dengan dialog pengesahan untuk tindakan penting */
export function ConfirmAction({
  action, fields = {}, label, title, body, confirmLabel, tone = "primary", note, noteRequired, size,
}: {
  action: Action; fields?: Record<string, string>; label: React.ReactNode; title: string; body?: React.ReactNode;
  confirmLabel: string; tone?: "primary" | "danger" | "ok" | "ghost" | "tag"; note?: string; noteRequired?: boolean; size?: "sm";
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const noteId = useId();
  const [state, formAction] = useActionState(action, null);
  const router = useRouter();
  useEffect(() => {
    // Jika ada pautan rahsia, kekalkan dialog terbuka; muat semula hanya selepas ditutup
    if (state?.ok && !state.link) {
      ref.current?.close();
      router.refresh();
    }
  }, [state, router]);
  const close = () => {
    ref.current?.close();
    if (state?.link) router.refresh();
  };
  const cls = `btn btn-${tone}${size === "sm" ? " btn-sm" : ""}`;
  return (
    <>
      <button type="button" className={cls} onClick={() => ref.current?.showModal()}>{label}</button>
      <dialog ref={ref} onClose={() => state?.link && router.refresh()} className="m-auto w-[min(92vw,30rem)] rounded-[12px] border border-line p-0 text-ink shadow-[0_24px_60px_-20px_rgba(23,32,54,.45)] backdrop:bg-ink/40">
        <form action={formAction} className="p-6">
          {Object.entries(fields).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
          <h2 className="font-display text-2xl font-bold">{title}</h2>
          {body && <div className="mt-2 text-[0.92rem] text-muted">{body}</div>}
          {note && (
            <div className="mt-4">
              <label className="field-label" htmlFor={noteId}>{note}</label>
              <textarea id={noteId} name="note" className="input" rows={3} required={noteRequired} maxLength={500} />
            </div>
          )}
          {state?.error && <div className="mt-4"><Alert tone="error">{state.error}</Alert></div>}
          {state?.ok && state.message && <div className="mt-4"><Alert tone="ok">{state.message}{state.link && <SecretLink link={state.link} />}</Alert></div>}
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className="btn btn-ghost" onClick={close}>{state?.link ? "Tutup" : "Batal"}</button>
            {!state?.link && <SubmitButton className={`btn btn-${tone === "ghost" ? "primary" : tone}`} pendingText="Sedang diproses…">{confirmLabel}</SubmitButton>}
          </div>
        </form>
      </dialog>
    </>
  );
}
