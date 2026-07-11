"use client";

import { ArrowLeft, BarChart3, ExternalLink, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { PageTitle } from "@/components/PageTitle";
import { currentUser, getUserById } from "@/lib/data/users";
import type { ChessGame, ExternalGameSource } from "@/lib/types/chess";
import { colorLabels, resultLabels } from "@/lib/utils/chess";
import { canDeleteGame, canEditGameNotes, canViewGame } from "@/lib/utils/gameRules";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { AnalysisStatusBadge } from "./AnalysisStatusBadge";
import { DeleteGameDialog } from "./DeleteGameDialog";
import { GameFormLoading } from "./NewGameContent";
import { OriginBadge } from "./OriginBadge";
import { RatingComparison } from "./RatingComparison";
import { ResultBadge } from "./ResultBadge";

const sourceLabels: Record<ExternalGameSource, string> = { presencial: "Presencial", "chess.com": "Chess.com", lichess: "Lichess", outro: "Outro" };
const actionClass = "inline-flex items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold text-neutral-800 hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function GameDetailsContent({ id }: { id: string }) {
  const router = useRouter();
  const getGameById = useGameStore((state) => state.getGameById);
  const deleteGame = useGameStore((state) => state.deleteGame);
  const [game, setGame] = useState<ChessGame | null | undefined>(undefined);
  const [deleteOpen, setDeleteOpen] = useState(false);
  useEffect(() => { let active = true; void hydrateGameStore().then(() => { if (active) setGame(getGameById(id) ?? null); }); return () => { active = false; }; }, [getGameById, id]);
  if (game === undefined) return <GameFormLoading title="Detalhes da partida" description="Carregando os dados armazenados neste navegador." />;
  if (game === null || !canViewGame(currentUser, game)) return <div className="space-y-6"><PageTitle eyebrow="Histórico" title="Partida não encontrada" description="A partida não existe ou não está disponível para este usuário." /><Link href="/partidas" className={actionClass}><ArrowLeft size={17} />Voltar para Minhas Partidas</Link></div>;
  const opponentUser = getUserById(game.opponentUserId);
  const deletable = canDeleteGame(currentUser, game);
  return <div className="space-y-6"><PageTitle eyebrow="Detalhes da partida" title={game.title} description={`Contra ${game.opponent}, em ${game.date}.`} />
    <section className={`rounded-2xl border p-5 sm:p-6 ${game.origin === "platform" ? "border-neutral-300 bg-neutral-100" : "border-blue-200 bg-blue-50"}`}><div className="flex flex-wrap gap-2"><OriginBadge origin={game.origin} /><span className="rounded-full border border-line bg-white px-2.5 py-1 text-xs font-semibold">{game.visibility === "private" ? "Privada" : "Pública"}</span></div><h2 className="mt-4 text-lg font-semibold">{game.origin === "platform" ? "Partida da plataforma" : "Partida externa e privada"}</h2><p className="mt-2 text-sm leading-6 text-neutral-700">{game.origin === "platform" ? "Esta partida foi registrada pelo TeaChess e conta para as estatísticas oficiais e para o ranking interno." : "Esta partida foi jogada fora do TeaChess e adicionada manualmente pelo jogador. Ela não conta para o ranking nem para as estatísticas públicas da plataforma."}</p></section>
    <section className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"><div className="flex flex-wrap items-center gap-2"><ResultBadge result={game.result} /><AnalysisStatusBadge status={game.analysisStatus} /></div><dl className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4"><Item label="Evento" value={game.event || "Não informado"} /><Item label="Data" value={game.date} /><Item label="Adversário" value={game.opponent} /><Item label="Resultado" value={resultLabels[game.result]} /><Item label="Cor" value={colorLabels[game.playerColor]} /><Item label="Abertura" value={game.opening} /><Item label="Quantidade de lances" value={String(game.moveCount)} /><Item label="Precisão simulada" value={game.accuracy === null ? "Não disponível" : `${game.accuracy.toFixed(1)}%`} /><Item label="Data de inclusão" value={new Date(game.createdAt).toLocaleDateString("pt-BR")} /><Item label="Adicionada por" value={game.addedManually ? currentUser.name : "TeaChess"} />{game.externalSource && <Item label="Fonte externa" value={`${sourceLabels[game.externalSource]}${game.externalSourceDetails ? ` — ${game.externalSourceDetails}` : ""}`} />}</dl>
      {game.onlineLink && <a href={game.onlineLink} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">Abrir link externo<ExternalLink size={15} /></a>}
      <Block label="PGN" value={game.pgn} /><Block label="FEN" value={game.fen} /><Block label="Observações" value={game.notes} />
      <div className="mt-5"><p className="text-xs font-semibold text-muted">Tags</p>{game.tags.length ? <ul className="mt-2 flex flex-wrap gap-2">{game.tags.map((tag) => <li key={tag} className="rounded-full bg-neutral-900 px-3 py-1 text-xs text-white">{tag}</li>)}</ul> : <p className="mt-1 text-sm text-muted">Nenhuma tag.</p>}</div>
    </section>
    <div className="grid gap-4 lg:grid-cols-2"><RatingComparison label={currentUser.name} ratingAtGame={game.playerRatingAtGame} currentRating={currentUser.currentPlatformRating} externalContext={game.origin === "external"} /><RatingComparison label={game.opponent} ratingAtGame={game.opponentRatingAtGame} currentRating={opponentUser?.currentPlatformRating} externalContext={game.origin === "external"} /></div>
    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">{canEditGameNotes(currentUser, game) && <Link href={`/partidas/${game.id}/editar`} className={actionClass}><Pencil size={17} />Editar observações</Link>}<Link href={`/partidas/${game.id}/analise`} className={actionClass}><BarChart3 size={17} />Abrir análise</Link><Link href="/partidas" className={actionClass}><ArrowLeft size={17} />Voltar para Minhas Partidas</Link>{deletable && <button type="button" onClick={() => setDeleteOpen(true)} className={`${actionClass} text-red-700`}><Trash2 size={17} />Excluir</button>}</div>
    <DeleteGameDialog open={deleteOpen} title="Excluir partida externa?" description="Esta partida privada será removida deste navegador. A ação não pode ser desfeita." confirmLabel="Excluir partida" destructive onCancel={() => setDeleteOpen(false)} onConfirm={() => { if (deleteGame(game.id)) router.push("/partidas"); }} />
  </div>;
}

function Item({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-1 text-sm font-medium text-neutral-900">{value}</dd></div>; }
function Block({ label, value }: { label: string; value: string }) { return <div className="mt-5"><p className="text-xs font-semibold text-muted">{label}</p><pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded-xl bg-neutral-100 p-3 font-mono text-xs leading-5">{value || "Não informado"}</pre></div>; }
