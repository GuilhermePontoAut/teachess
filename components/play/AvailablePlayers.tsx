import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import type { AvailablePlayer } from "@/lib/types/play";
import { PlayerCard } from "./PlayerCard";
import { buttonBase } from "./play";
import { currentUser } from "@/lib/data/users";
import { acceptsDirectChallenge } from "@/lib/utils/matchmaking";

type RatingFilter = "all" | "under-1700" | "1700-1799" | "1800-plus";

export function AvailablePlayers({ players, selectedId, onSelect }: { players: AvailablePlayer[]; selectedId: string | null; onSelect: (player: AvailablePlayer) => void }) {
  const [query, setQuery] = useState("");
  const [rating, setRating] = useState<RatingFilter>("all");
  const [showAll, setShowAll] = useState(false);
  const filtered = useMemo(() => players.filter((player) => {
    const nameMatches = player.name.toLocaleLowerCase("pt-BR").includes(query.trim().toLocaleLowerCase("pt-BR"));
    const ratingMatches = rating === "all" || (rating === "under-1700" && player.currentPlatformRating < 1700) || (rating === "1700-1799" && player.currentPlatformRating >= 1700 && player.currentPlatformRating <= 1799) || (rating === "1800-plus" && player.currentPlatformRating >= 1800);
    return nameMatches && ratingMatches;
  }), [players, query, rating]);
  const visible = showAll ? filtered : filtered.slice(0, 8);
  return <section aria-labelledby="players-title"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 id="players-title" className="text-lg font-semibold">Adversários simulados</h2><p className="mt-1 text-sm text-muted">A presença é fictícia e não expõe dados privados.</p></div><p className="text-xs font-semibold text-muted">{filtered.length} jogador(es)</p></div>
    <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_190px]"><label className="relative"><span className="sr-only">Buscar jogador por nome</span><Search className="pointer-events-none absolute left-3 top-3 text-neutral-400" size={18}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome" className="w-full rounded-xl border border-line bg-white py-2.5 pl-10 pr-3 text-sm focus-visible:outline-2 focus-visible:outline-focus"/></label><label><span className="sr-only">Filtrar por faixa de rating</span><select value={rating} onChange={(event) => setRating(event.target.value as RatingFilter)} className="w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm focus-visible:outline-2 focus-visible:outline-focus"><option value="all">Todos os ratings</option><option value="under-1700">Até 1699</option><option value="1700-1799">1700 a 1799</option><option value="1800-plus">1800 ou mais</option></select></label></div>
    {visible.length ? <div className="mt-4 grid gap-3 md:grid-cols-2">{visible.map((player) => <PlayerCard key={player.id} player={player} selected={selectedId === player.id} ratingAccepted={acceptsDirectChallenge(player, currentUser.currentPlatformRating)} onSelect={() => onSelect(player)}/>)}</div> : <div role="status" className="mt-4 rounded-2xl border border-dashed border-line-strong bg-neutral-50 p-8 text-center"><p className="font-semibold">Nenhum jogador encontrado</p><p className="mt-1 text-sm text-muted">Ajuste a busca ou a faixa de rating.</p></div>}
    {filtered.length > 8 && <button type="button" onClick={() => setShowAll((value) => !value)} className={`${buttonBase} mt-4 border border-line bg-white hover:bg-neutral-100`}>{showAll ? "Mostrar somente oito" : `Mostrar todos (${filtered.length})`}</button>}
  </section>;
}
