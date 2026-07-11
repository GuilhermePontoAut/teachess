"use client";

import { ArrowLeft, Save, X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useMemo, useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { MockNotice } from "@/components/MockNotice";
import { currentUser, getUserById } from "@/lib/data/users";
import type { ChessGame } from "@/lib/types/chess";
import { colorLabels, resultLabels } from "@/lib/utils/chess";
import { canEditGameDetails, canEditGameNotes, isExternalGame } from "@/lib/utils/gameRules";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { DeleteGameDialog } from "./DeleteGameDialog";
import { GameForm } from "./GameForm";
import { GameFormLoading } from "./NewGameContent";
import { formValuesToGameData, gameToFormValues, type GameFormValues } from "./gameForm";
import { OriginBadge } from "./OriginBadge";
import { RatingComparison } from "./RatingComparison";
import { TagInput } from "./TagInput";

export function EditGameContent({ id }: { id: string }) {
  const router = useRouter();
  const getGameById = useGameStore((state) => state.getGameById);
  const updateGame = useGameStore((state) => state.updateGame);
  const updateGameNotes = useGameStore((state) => state.updateGameNotes);
  const [game, setGame] = useState<ChessGame | null | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [cancelOpen, setCancelOpen] = useState(false);
  useEffect(() => { let active = true; void hydrateGameStore().then(() => { const found = getGameById(id) ?? null; if (active) { setGame(found); setNotes(found?.notes ?? ""); setTags(found?.tags ?? []); } }); return () => { active = false; }; }, [getGameById, id]);
  const dirty = useMemo(() => game ? notes !== game.notes || JSON.stringify(tags) !== JSON.stringify(game.tags) : false, [game, notes, tags]);
  if (game === undefined) return <GameFormLoading title="Editar observações" description="Carregando os dados armazenados neste navegador." />;
  if (game === null) return <NotFound />;
  const canEditDetails = isExternalGame(game) && canEditGameDetails(currentUser, game);
  const canEditNotes = canEditGameNotes(currentUser, game);
  if (!canEditDetails && !canEditNotes) return <NotFound />;

  if (canEditDetails) {
    const submitFullGame = (values: GameFormValues) => {
      const saved = updateGame({
        ...game,
        ...formValuesToGameData(values),
        id: game.id,
        ownerUserId: game.ownerUserId,
        playerUserId: game.playerUserId,
        origin: "external",
        visibility: "private",
        addedManually: true,
        createdAt: game.createdAt,
        updatedAt: new Date().toISOString(),
      });
      if (saved) router.push("/partidas?success=game-updated");
    };

    return <div className="space-y-6"><PageTitle eyebrow="Histórico privado" title="Editar partida" description={`Atualize os dados informados manualmente para a partida contra ${game.opponent}.`} /><MockNotice>Esta partida externa continuará privada, não contará para o ranking e não alterará o rating oficial.</MockNotice><GameForm mode="edit" initialValues={gameToFormValues(game)} onCancel={() => router.push(`/partidas/${game.id}`)} onSubmit={submitFullGame} /></div>;
  }

  const opponentUser = getUserById(game.opponentUserId);
  const cancel = () => dirty ? setCancelOpen(true) : router.push(`/partidas/${game.id}`);
  const submit = (event: FormEvent) => { event.preventDefault(); if (updateGameNotes(game.id, notes.trim(), tags.map((tag) => tag.trim()))) router.push("/partidas?success=updated"); };

  return <div className="space-y-6"><PageTitle eyebrow="Histórico" title="Editar observações" description={`Registre aprendizados pessoais sobre a partida contra ${game.opponent}.`} />
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center gap-2"><OriginBadge origin={game.origin} /><span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold">{resultLabels[game.result]}</span></div><dl className="mt-5 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4"><ReadOnly label="Adversário" value={game.opponent} /><ReadOnly label="Data" value={game.date} /><ReadOnly label="Cor" value={colorLabels[game.playerColor]} /><ReadOnly label="Abertura" value={game.opening} /></dl><div className="mt-5"><RatingComparison label={currentUser.name} ratingAtGame={game.playerRatingAtGame} currentRating={currentUser.currentPlatformRating} externalContext={game.origin === "external"} /></div>{opponentUser && <div className="mt-4"><RatingComparison label={opponentUser.name} ratingAtGame={game.opponentRatingAtGame} currentRating={opponentUser.currentPlatformRating} /></div>}{game.pgn && <ReadOnlyBlock label="PGN" value={game.pgn} />}{game.fen && <ReadOnlyBlock label="FEN" value={game.fen} />}</section>
    <form onSubmit={submit} className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"><label htmlFor="notes" className="text-sm font-semibold">Observações pessoais</label><textarea id="notes" rows={7} value={notes} onChange={(event) => setNotes(event.target.value)} className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 text-sm outline-none focus:border-neutral-700 focus:ring-2 focus:ring-neutral-300" /><div className="mt-5"><TagInput tags={tags} onChange={setTags} /></div><div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={cancel} className="inline-flex items-center justify-center gap-2 rounded-xl border border-line px-5 py-2.5 text-sm font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><X size={17} />Cancelar</button><button type="submit" className="inline-flex items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><Save size={17} />Salvar observações</button></div></form>
    <DeleteGameDialog open={cancelOpen} title="Descartar alterações?" description="As observações e tags alteradas serão perdidas." confirmLabel="Descartar alterações" destructive onCancel={() => setCancelOpen(false)} onConfirm={() => router.push(`/partidas/${game.id}`)} />
  </div>;
}

function ReadOnly({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 font-medium text-neutral-900">{value}</dd></div>; }
function ReadOnlyBlock({ label, value }: { label: string; value: string }) { return <div className="mt-5"><p className="text-xs font-semibold text-muted">{label} · somente leitura</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-neutral-100 p-3 font-mono text-xs leading-5">{value}</pre></div>; }
function NotFound() { return <div className="space-y-6"><PageTitle eyebrow="Histórico" title="Partida não encontrada" description="A partida não existe ou não está disponível para este usuário." /><Link href="/partidas" className="inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white"><ArrowLeft size={17} />Voltar para Minhas Partidas</Link></div>; }
