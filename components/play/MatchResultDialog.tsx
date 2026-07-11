"use client";
import { useEffect, useRef } from "react";
import { Trophy } from "lucide-react";
import type { MatchResult } from "@/lib/types/play";
import { buttonBase, reasonLabels } from "./play";

export function MatchResultDialog({ result, moveCount, durationSeconds, onNew, onBack }: { result: MatchResult | null; moveCount: number; durationSeconds: number; onNew: () => void; onBack: () => void }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => { const dialog = ref.current; if (result && !dialog?.open) dialog?.showModal(); if (!result && dialog?.open) dialog.close(); }, [result]);
  if (!result) return null;
  const outcome = result.winner ? `Vitória das ${result.winner === "white" ? "brancas" : "pretas"}` : "Empate";
  return <dialog ref={ref} onCancel={(event) => event.preventDefault()} aria-labelledby="result-title" aria-describedby="result-description" className="m-auto w-[calc(100%-2rem)] max-w-lg rounded-2xl border border-line bg-white p-0 shadow-2xl backdrop:bg-black/60"><div className="p-6 text-center"><span className="mx-auto flex size-12 items-center justify-center rounded-full bg-neutral-950 text-white"><Trophy size={23} aria-hidden="true"/></span><p className="mt-4 text-xs font-bold tracking-wider text-muted">RESULTADO DEMONSTRATIVO</p><h2 id="result-title" className="mt-1 text-2xl font-bold">{outcome}</h2><p id="result-description" className="mt-2 text-sm text-muted">{reasonLabels[result.reason]}</p><dl className="mt-5 grid grid-cols-2 gap-3 rounded-xl bg-neutral-100 p-4 text-sm"><div><dt className="text-muted">Lances</dt><dd className="font-bold">{moveCount}</dd></div><div><dt className="text-muted">Duração</dt><dd className="font-bold">{Math.floor(durationSeconds / 60)}min {durationSeconds % 60}s</dd></div></dl><p className="mt-5 rounded-xl border border-line p-3 text-sm font-semibold">Este resultado não foi registrado e não altera o rating ou o ranking.</p></div><div className="flex flex-col gap-2 border-t border-line bg-neutral-50 p-4 sm:flex-row sm:justify-end"><button type="button" onClick={onBack} className={`${buttonBase} border border-line bg-white hover:bg-neutral-100`}>Voltar à preparação</button><button type="button" onClick={onNew} className={`${buttonBase} bg-neutral-950 text-white hover:bg-neutral-800`}>Nova demonstração</button></div></dialog>;
}
