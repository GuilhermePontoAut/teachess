import { BarChart3, Eye, Pencil, Trash2 } from "lucide-react";
import Link from "next/link";
import type { ChessGame } from "@/lib/types/chess";
import { currentUser } from "@/lib/data/users";
import { canDeleteGame, canEditGameDetails, canEditGameNotes } from "@/lib/utils/gameRules";

const actionClass = "inline-flex items-center gap-2 whitespace-nowrap rounded-lg px-2.5 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

export function GameActions({ game, onDelete }: { game: ChessGame; onDelete: (game: ChessGame) => void }) {
  const editLabel = canEditGameDetails(currentUser, game) ? "Editar partida" : canEditGameNotes(currentUser, game) ? "Editar observações" : null;
  return <div className="flex flex-wrap items-center gap-1" aria-label={`Ações para partida contra ${game.opponent}`}><Link href={`/partidas/${game.id}`} aria-label={`Ver detalhes da partida contra ${game.opponent}`} className={actionClass}><Eye size={16} aria-hidden="true" />Ver detalhes</Link>{editLabel && <Link href={`/partidas/${game.id}/editar`} aria-label={`${editLabel} contra ${game.opponent}`} className={actionClass}><Pencil size={16} aria-hidden="true" />{editLabel}</Link>}<Link href={`/partidas/${game.id}/analise`} aria-label={`Abrir análise da partida contra ${game.opponent}`} className={actionClass}><BarChart3 size={16} aria-hidden="true" />Abrir análise</Link>{canDeleteGame(currentUser, game) && <button type="button" onClick={() => onDelete(game)} aria-label={`Excluir partida contra ${game.opponent}`} className={`${actionClass} text-red-700`}><Trash2 size={16} aria-hidden="true" />Excluir</button>}</div>;
}
