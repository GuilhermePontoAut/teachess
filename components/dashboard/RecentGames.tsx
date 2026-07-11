import { ArrowRight } from "lucide-react";
import Link from "next/link";
import type { ChessGame } from "@/lib/types/chess";
import { colorLabels, resultLabels } from "@/lib/utils/chess";
import { resultStyles } from "./dashboard";

const formatDate = (date: string) => new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(`${date}T12:00:00`));

export function RecentGames({ games }: { games: ChessGame[] }) {
  return <section aria-labelledby="recent-games-title" className="overflow-hidden rounded-2xl border border-line bg-surface shadow-sm">
    <div className="flex flex-col gap-4 border-b border-line p-5 sm:flex-row sm:items-end sm:justify-between sm:p-6">
      <div><p className="section-kicker">Histórico</p><h2 id="recent-games-title" className="text-lg font-semibold text-neutral-950">Últimas partidas</h2><p className="mt-1 text-sm text-muted">As cinco partidas mais recentes.</p></div>
      <Link href="/partidas" className="inline-flex items-center gap-2 self-start rounded-xl border border-line px-3.5 py-2 text-sm font-semibold text-neutral-800 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Ver todas <ArrowRight size={16} aria-hidden="true" /></Link>
    </div>
    <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm">
      <thead className="bg-surface-subtle text-xs font-semibold text-muted"><tr><th className="px-6 py-3">Adversário</th><th className="px-4 py-3">Data</th><th className="px-4 py-3">Cor</th><th className="px-4 py-3">Resultado</th><th className="px-4 py-3">Abertura</th><th className="px-6 py-3 text-right">Precisão</th></tr></thead>
      <tbody className="divide-y divide-neutral-200">{games.map((game) => <tr key={game.id} className="text-neutral-700">
        <td className="px-6 py-4 font-semibold text-neutral-900">{game.opponent}</td><td className="whitespace-nowrap px-4 py-4">{formatDate(game.date)}</td><td className="px-4 py-4">{colorLabels[game.playerColor]}</td><td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${resultStyles[game.result]}`}>{resultLabels[game.result]}</span></td><td className="max-w-52 px-4 py-4">{game.opening || "Não informado"}</td><td className="whitespace-nowrap px-6 py-4 text-right font-medium">{game.accuracy === null ? "Pendente" : `${game.accuracy.toFixed(1)}%`}</td>
      </tr>)}</tbody>
    </table></div>
  </section>;
}
