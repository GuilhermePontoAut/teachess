"use client";
import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { buttonBase } from "./play";

export function MatchDialog({ open, title, description, confirmLabel, destructive = false, onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel: string; destructive?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; if (open && !dialog?.open) dialog?.showModal(); if (!open && dialog?.open) dialog.close(); }, [open]);
  return <dialog ref={ref} onCancel={(event) => { event.preventDefault(); onCancel(); }} onClose={onCancel} aria-labelledby={`match-dialog-${confirmLabel}-title`} aria-describedby={`match-dialog-${confirmLabel}-description`} className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-black/60"><div className="p-6"><span className={`flex size-11 items-center justify-center rounded-full ${destructive ? "bg-danger-subtle text-danger" : "bg-neutral-100"}`}><AlertTriangle size={21} aria-hidden="true"/></span><h2 id={`match-dialog-${confirmLabel}-title`} className="mt-4 text-lg font-semibold">{title}</h2><p id={`match-dialog-${confirmLabel}-description`} className="mt-2 text-sm leading-6 text-muted">{description}</p></div><div className="flex flex-col-reverse gap-2 border-t border-line bg-neutral-50 p-4 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className={`${buttonBase} border border-line bg-white hover:bg-neutral-100`}>Cancelar</button><button type="button" onClick={onConfirm} className={`${buttonBase} text-white ${destructive ? "bg-red-700 hover:bg-red-800" : "bg-neutral-950 hover:bg-neutral-800"}`}>{confirmLabel}</button></div></dialog>;
}
