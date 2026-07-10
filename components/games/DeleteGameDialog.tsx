"use client";

import { AlertTriangle } from "lucide-react";
import { useEffect, useRef } from "react";

export function DeleteGameDialog({ open, title, description, confirmLabel, destructive = false, onCancel, onConfirm }: { open: boolean; title: string; description: string; confirmLabel: string; destructive?: boolean; onCancel: () => void; onConfirm: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return <dialog ref={dialogRef} onCancel={(event) => { event.preventDefault(); onCancel(); }} onClose={onCancel} aria-labelledby="confirmation-title" aria-describedby="confirmation-description" className="m-auto w-[calc(100%-2rem)] max-w-md rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-black/55">
    <div className="p-6"><span className={`flex size-11 items-center justify-center rounded-full ${destructive ? "bg-red-50 text-danger" : "bg-neutral-100 text-neutral-800"}`}><AlertTriangle size={21} aria-hidden="true" /></span><h2 id="confirmation-title" className="mt-4 text-lg font-semibold text-neutral-950">{title}</h2><p id="confirmation-description" className="mt-2 text-sm leading-6 text-muted">{description}</p></div>
    <div className="flex flex-col-reverse gap-2 border-t border-line bg-neutral-50 p-4 sm:flex-row sm:justify-end"><button type="button" onClick={onCancel} className="rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Cancelar</button><button type="button" onClick={onConfirm} className={`rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 ${destructive ? "bg-red-700 hover:bg-red-800 focus-visible:outline-red-700" : "bg-neutral-950 hover:bg-neutral-800 focus-visible:outline-focus"}`}>{confirmLabel}</button></div>
  </dialog>;
}
