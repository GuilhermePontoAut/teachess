"use client";
import Link from "next/link";
import { ArrowLeft, Lock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { currentUser } from "@/lib/data/users";
import type { PlayerColor } from "@/lib/types/chess";
import { getUploadPreviewUrl, hydrateUploadStore, useUploadStore } from "@/store/useUploadStore";
import { imageOriginLabels, simulatedRecognitionDisclaimer, sourceContextLabels } from "@/components/uploads/uploads";
import { FutureTeacherPanel } from "./FutureTeacherPanel";
import { PositionBoard } from "./PositionBoard";
import { PositionNotFound } from "./PositionNotFound";
import { PositionSourceCard } from "./PositionSourceCard";
import { PositionStudyTools } from "./PositionStudyTools";

const initialPositionFen = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export function PositionStudyContent({ id }: { id: string }) {
  const uploads = useUploadStore((state) => state.uploads); const updateStudy = useUploadStore((state) => state.updateStudy); const [hydrated, setHydrated] = useState(false); const [orientation, setOrientation] = useState<PlayerColor>("white"); const [resetSignal, setResetSignal] = useState(0); const [currentFen, setCurrentFen] = useState(""); const [copied, setCopied] = useState(false);
  useEffect(() => { let active = true; void hydrateUploadStore().finally(() => { if (active) setHydrated(true); }); return () => { active = false; }; }, []);
  const onFenChange = useCallback((fen: string) => setCurrentFen(fen), []);
  if (!hydrated) return <div role="status" className="animate-pulse rounded-2xl border border-line bg-white p-8">Carregando posição…</div>;
  const upload = uploads.find((item) => item.id === id && item.ownerUserId === currentUser.id);
  if (!upload) return <PositionNotFound/>;
  const copyFen = async () => { if (!upload.simulatedDetectedFen) return; await navigator.clipboard.writeText(upload.simulatedDetectedFen); setCopied(true); window.setTimeout(() => setCopied(false), 1800); };
  const originalFen = upload.simulatedDetectedFen ?? initialPositionFen;
  return <div className="space-y-6"><header className="rounded-2xl border border-line bg-white p-5 shadow-sm"><Link href="/enviar-imagem" className="inline-flex items-center gap-2 text-sm font-semibold text-muted hover:text-neutral-950"><ArrowLeft size={16}/>Voltar a Meus envios</Link><div className="mt-4 flex flex-wrap items-start justify-between gap-4"><div><div className="flex flex-wrap items-center gap-2"><h1 className="text-2xl font-semibold sm:text-3xl">{upload.title}</h1><span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-bold text-white"><Lock size={12}/>Posição privada</span></div><p className="mt-2 text-sm text-muted">{imageOriginLabels[upload.imageOrigin]} · {sourceContextLabels[upload.sourceContext]}{upload.sourceDetails ? ` — ${upload.sourceDetails}` : ""} · {new Date(`${upload.date}T12:00:00`).toLocaleDateString("pt-BR")}</p></div></div></header><div className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,.85fr)]"><div className="space-y-6"><PositionSourceCard upload={upload} previewUrl={getUploadPreviewUrl(upload.id)}/><section className="rounded-2xl border border-line bg-white p-5 shadow-sm"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 className="text-lg font-semibold">Tabuleiro de estudo</h2><p className="mt-1 text-sm text-muted">Lado a jogar: {upload.simulatedSideToMove === "black" ? "Pretas" : "Brancas"}{upload.simulatedDetectedFen ? " · simulado" : " · não reconhecido"}</p></div><span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-900">Posição simulada</span></div>{!upload.simulatedDetectedFen && <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">Nenhuma posição foi reconhecida. A posição inicial abaixo é somente um placeholder visual e não corresponde necessariamente à imagem.</p>}<div className="mx-auto mt-4 max-w-2xl"><PositionBoard key={resetSignal} id={upload.id} simulatedFen={upload.simulatedDetectedFen} orientation={orientation} onFenChange={onFenChange}/></div><label htmlFor="demo-fen" className="mt-4 block text-sm font-semibold">FEN demonstrativo em estudo</label><input id="demo-fen" readOnly value={currentFen || originalFen} className="mt-2 w-full rounded-xl border border-line bg-neutral-50 px-3 py-2.5 font-mono text-xs"/><p className="mt-3 rounded-xl bg-neutral-100 p-3 text-xs leading-5 text-muted">{simulatedRecognitionDisclaimer}</p></section></div><PositionStudyTools favorite={upload.favorite} notes={upload.personalStudyNotes} copied={copied} onFlip={() => setOrientation((value) => value === "white" ? "black" : "white")} onReset={() => { setCurrentFen(originalFen); setResetSignal((value) => value + 1); }} onCopy={() => { void copyFen(); }} onFavorite={() => updateStudy(upload.id, { favorite: !upload.favorite })} onNotesChange={(personalStudyNotes) => updateStudy(upload.id, { personalStudyNotes })}/></div><FutureTeacherPanel/></div>;
}
