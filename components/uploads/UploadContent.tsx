"use client";
import Link from "next/link";
import { ExternalLink, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import { DeleteGameDialog } from "@/components/games/DeleteGameDialog";
import { mockGames } from "@/lib/data/games";
import { currentUser } from "@/lib/data/users";
import type { UploadedPosition, UploadMimeType } from "@/lib/types/chess";
import { hydrateUploadStore, setUploadPreviewUrl, useUploadStore } from "@/store/useUploadStore";
import { SavedUploads } from "./SavedUploads";
import { UploadDetailsDialog } from "./UploadDetailsDialog";
import { UploadForm } from "./UploadForm";
import type { PreviewImage } from "./UploadDropzone";
import type { UploadFormValues } from "./uploadForm";

const simulatedFens = {
  physical_board_photo: "8/5pk1/4p1p1/3pP3/3P1P2/6P1/5K2/8 w - - 0 38",
  online_game_screenshot: "r2q1rk1/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PPQN1PPP/R1B2RK1 w - - 4 10",
} as const;

export function UploadContent() {
  const uploads = useUploadStore((state) => state.uploads); const addUpload = useUploadStore((state) => state.addUpload); const deleteUpload = useUploadStore((state) => state.deleteUpload); const resetUploads = useUploadStore((state) => state.resetUploads);
  const [hydrated, setHydrated] = useState(false); const [tab, setTab] = useState<"new" | "saved">("new"); const [message, setMessage] = useState(""); const [savedId, setSavedId] = useState<string | null>(null); const [selected, setSelected] = useState<UploadedPosition | null>(null); const [dialogMode, setDialogMode] = useState<"details" | "demo">("details"); const [deleting, setDeleting] = useState<UploadedPosition | null>(null); const [restore, setRestore] = useState(false);
  useEffect(() => { let active = true; void hydrateUploadStore().finally(() => { if (active) { setHydrated(true); if (window.location.hash === "#meus-envios") setTab("saved"); } }); return () => { active = false; }; }, []);
  const save = async (values: UploadFormValues, image: PreviewImage) => {
    await new Promise((resolve) => setTimeout(resolve, 350));
    const now = new Date().toISOString(); const id = crypto.randomUUID(); const imageOrigin = values.imageOrigin || "physical_board_photo"; const fen = simulatedFens[imageOrigin];
    setUploadPreviewUrl(id, URL.createObjectURL(image.file));
    addUpload({ id, ownerUserId: currentUser.id, visibility: "private", title: values.title.trim(), imageOrigin, sourceContext: values.sourceContext || "other", sourceDetails: values.sourceDetails.trim(), date: values.date, description: values.description.trim(), linkedGameId: values.linkedGameId || null, tags: values.tags, fileName: image.file.name, fileSize: image.file.size, mimeType: image.file.type as UploadMimeType, simulatedDetectedFen: fen, simulatedSideToMove: "white", simulatedConfidence: imageOrigin === "physical_board_photo" ? 0.87 : 0.93, recognitionStatus: "demo_available", favorite: false, personalStudyNotes: "", migrationNote: null, createdAt: now, updatedAt: now });
    setSavedId(id); setMessage("Posição salva com sucesso. Somente os metadados foram persistidos; o reconhecimento exibido é simulado."); setTab("saved");
  };
  if (!hydrated) return <div role="status" className="animate-pulse rounded-2xl border border-line bg-white p-8">Carregando posições…</div>;
  return <div className="space-y-7"><PageTitle eyebrow="Estudo privado" title="Enviar Imagem" description="Envie uma foto ou print de uma única posição para preparar seu estudo."/><MockNotice>Nenhuma posição é extraída da imagem. O FEN e a interpretação disponíveis após salvar são dados demonstrativos, determinísticos e claramente simulados.</MockNotice><div role="tablist" aria-label="Seções de posições" className="inline-flex rounded-xl border border-line bg-white p-1">{[["new", "Nova posição"], ["saved", "Meus envios"]].map(([value, label]) => <button key={value} role="tab" aria-selected={tab === value} type="button" onClick={() => { setTab(value as "new" | "saved"); setMessage(""); setSavedId(null); }} className={`rounded-lg px-4 py-2.5 text-sm font-semibold ${tab === value ? "bg-neutral-950 text-white" : "text-neutral-700 hover:bg-neutral-100"}`}>{label}</button>)}</div>{message && <div role="status" aria-live="polite" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-medium text-green-800"><span>{message}</span>{savedId && <div className="flex flex-wrap gap-2"><Link href={`/estudo/posicoes/${savedId}`} className="inline-flex items-center gap-2 rounded-lg bg-neutral-950 px-3 py-2 text-white"><ExternalLink size={15}/>Abrir no tabuleiro</Link><button type="button" onClick={() => { setTab("new"); setMessage(""); setSavedId(null); }} className="inline-flex items-center gap-2 rounded-lg border border-green-300 px-3 py-2"><Plus size={15}/>Cadastrar outra posição</button></div>}</div>}{tab === "new" ? <UploadForm games={mockGames.filter((game) => game.ownerUserId === currentUser.id)} onSave={save}/> : <SavedUploads uploads={uploads.filter((upload) => upload.ownerUserId === currentUser.id)} onDetails={(upload) => { setSelected(upload); setDialogMode("details"); }} onDemo={(upload) => { setSelected(upload); setDialogMode("demo"); }} onDelete={setDeleting} onRestore={() => setRestore(true)}/>}<UploadDetailsDialog upload={selected} mode={dialogMode} onClose={() => setSelected(null)}/><DeleteGameDialog open={Boolean(deleting)} title="Excluir posição?" description={`A posição “${deleting?.title ?? "selecionada"}” será removida deste navegador. Esta ação não pode ser desfeita.`} confirmLabel="Excluir posição" destructive onCancel={() => setDeleting(null)} onConfirm={() => { if (deleting && deleteUpload(deleting.id)) setMessage(`Posição “${deleting.title}” excluída.`); setDeleting(null); }}/><DeleteGameDialog open={restore} title="Restaurar dados de demonstração?" description="As posições atuais serão substituídas pelos dados simulados originais do TeaChess." confirmLabel="Restaurar dados" onCancel={() => setRestore(false)} onConfirm={() => { resetUploads(); setRestore(false); setMessage("Dados de demonstração restaurados com sucesso."); }}/></div>;
}
