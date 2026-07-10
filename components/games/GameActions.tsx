import { BarChart3, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ChessGame } from "@/lib/types/chess";

const actionClass = "inline-flex items-center gap-2 rounded-lg px-2.5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function GameActions({ game, onDelete }: { game: ChessGame; onDelete: (game: ChessGame) => void }) {
  return <div className="flex flex-wrap items-center gap-1" aria-label={`Ações para partida contra ${game.opponent}`}><Link href={`/partidas/${game.id}`} className={actionClass}><Eye size={16} aria-hidden="true" />Ver detalhes</Link><Link href={`/partidas/${game.id}/editar`} className={actionClass}><Pencil size={16} aria-hidden="true" />Editar</Link><Link href={`/partidas/${game.id}/analise`} className={actionClass}><BarChart3 size={16} aria-hidden="true" />Abrir análise</Link><button type="button" onClick={() => onDelete(game)} className={`${actionClass} text-red-700`}><Trash2 size={16} aria-hidden="true" />Excluir</button></div>;
}
