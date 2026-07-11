import { Award } from "lucide-react";
import type { RankingPlayer } from "@/lib/types/chess";
import { formatPercent, getInitials, levelLabels } from "./ranking";

const podiumStyles = ["border-amber-300 lg:-translate-y-3", "border-slate-300", "border-orange-300"];
const medals = ["Ouro · 1º lugar", "Prata · 2º lugar", "Bronze · 3º lugar"];

function PodiumPlayerCard({ player, visualIndex }: { player: RankingPlayer; visualIndex: number }) {
  return <article className={`relative rounded-2xl border-2 bg-white p-5 shadow-sm ${podiumStyles[visualIndex]}`}><div className="flex items-start justify-between gap-3"><span className="flex size-12 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white" aria-hidden="true">{getInitials(player.name)}</span><span className="rounded-full border border-line px-2.5 py-1 text-xs font-bold">{medals[visualIndex]}</span></div><h3 className="mt-4 text-lg font-semibold">{player.name}</h3><p className="text-sm text-muted">{player.region} · {levelLabels[player.level]}</p><div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-4 text-sm"><div><p className="text-xs text-muted">Rating</p><p className="font-bold tabular-nums">{player.currentPlatformRating}</p></div><div><p className="text-xs text-muted">Vitórias</p><p className="font-bold tabular-nums">{formatPercent(player.winRate)}</p></div><div><p className="text-xs text-muted">Partidas</p><p className="font-bold tabular-nums">{player.platformGames}</p></div></div></article>;
}

export function RankingPodium({ players }: { players: RankingPlayer[] }) {
  const top = players.slice(0, 3);
  if (!top.length) return null;
  return <section aria-labelledby="podium-title"><div className="mb-7 flex items-center gap-2"><Award size={20} aria-hidden="true" /><h2 id="podium-title" className="text-xl font-semibold">Pódio da comunidade</h2></div><div className="grid gap-4 lg:grid-cols-3">{top.map((player, index) => <PodiumPlayerCard key={player.id} player={player} visualIndex={index} />)}</div></section>;
}
