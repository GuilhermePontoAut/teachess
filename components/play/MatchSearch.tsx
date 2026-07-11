import { useEffect, useState } from "react";
import { currentUser } from "@/lib/data/users";
import type { AvailablePlayer, DemoColorChoice, DemoMatchConfig, RatingRangeOption, StartMatchResult, TimeControl } from "@/lib/types/play";
import { findSimulatedOpponent, ratingDifference } from "@/lib/utils/matchmaking";
import { assignedColor, buttonBase } from "./play";

interface MatchSearchProps { players: AvailablePlayer[]; timeControl: TimeControl | null; colorChoice: DemoColorChoice | null; randomIndex: number; hasActiveMatch: boolean; onContinue: () => void; onStart: (config: DemoMatchConfig) => StartMatchResult; }

export function MatchSearch({ players, timeControl, colorChoice, randomIndex, hasActiveMatch, onContinue, onStart }: MatchSearchProps) {
  const [range, setRange] = useState<RatingRangeOption>("200");
  const [searching, setSearching] = useState(false); const [seconds, setSeconds] = useState(0);
  const [found, setFound] = useState<AvailablePlayer | null>(null); const [searchedWithoutResult, setSearchedWithoutResult] = useState(false);
  useEffect(() => { if (!searching || !timeControl || hasActiveMatch) return; const interval = window.setInterval(() => setSeconds((value) => value + 1), 1000); const timeout = window.setTimeout(() => { if (hasActiveMatch) return; const candidate = findSimulatedOpponent(players, currentUser.id, currentUser.currentPlatformRating, range, timeControl); setSearching(false); setFound(candidate); setSearchedWithoutResult(!candidate); }, 2000); return () => { window.clearInterval(interval); window.clearTimeout(timeout); }; }, [hasActiveMatch, players, range, searching, timeControl]);
  const begin = () => { if (!timeControl || !colorChoice || hasActiveMatch) return; setSeconds(0); setFound(null); setSearchedWithoutResult(false); setSearching(true); };
  const confirm = () => { if (!found || !timeControl || !colorChoice) return; const result = onStart({ opponent: found, timeControl, userColor: assignedColor(colorChoice, randomIndex) }); if (!result.success) { setSearching(false); setFound(null); } };
  const label = range === "unlimited" ? "Sem limite" : `±${range}`;
  const blockedReason = "Você já possui uma partida em andamento. Continue ou encerre essa partida antes de iniciar outra.";
  return <section aria-labelledby="search-title" className="rounded-2xl border border-line bg-neutral-950 p-5 text-white"><h2 id="search-title" className="text-lg font-semibold">Procurar partida</h2><p className="mt-1 text-sm text-neutral-300">A busca é simulada. Nenhum jogador real está sendo procurado ou conectado.</p>
    {hasActiveMatch && <div role="status" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950"><p className="font-semibold">{blockedReason}</p><button type="button" onClick={onContinue} className={`${buttonBase} mt-3 bg-neutral-950 text-white`}>Continuar partida</button></div>}
    <label className="mt-4 block text-sm font-semibold">Faixa de rating<select value={range} disabled={searching} onChange={(event) => setRange(event.target.value as RatingRangeOption)} className="mt-2 w-full rounded-xl border border-neutral-600 bg-neutral-900 px-3 py-2.5 text-white focus-visible:outline-2 focus-visible:outline-focus"><option value="100">±100</option><option value="200">±200</option><option value="400">±400</option><option value="unlimited">Sem limite</option></select></label>
    {searching && <div role="status" className="mt-4 rounded-xl bg-neutral-800 p-4"><p className="font-semibold">Procurando adversário… {seconds}s</p><p className="text-sm text-neutral-300">Faixa atual: {label}</p><button type="button" onClick={() => setSearching(false)} className={`${buttonBase} mt-3 border border-neutral-500 hover:bg-neutral-700`}>Cancelar busca</button></div>}
    {searchedWithoutResult && !hasActiveMatch && <div role="status" className="mt-4 rounded-xl bg-neutral-800 p-4"><p className="font-semibold">Nenhum adversário disponível nessa faixa.</p><button type="button" onClick={() => setRange(range === "100" ? "200" : range === "200" ? "400" : "unlimited")} className={`${buttonBase} mt-3 border border-neutral-500 hover:bg-neutral-700`}>Ampliar faixa</button></div>}
    {found && !hasActiveMatch && <div role="status" className="mt-4 rounded-xl bg-white p-4 text-neutral-950"><p className="font-semibold">Adversário encontrado: {found.name}</p><p className="text-sm text-muted">Rating {found.currentPlatformRating} · diferença {ratingDifference(found.currentPlatformRating, currentUser.currentPlatformRating) > 0 ? "+" : ""}{ratingDifference(found.currentPlatformRating, currentUser.currentPlatformRating)}</p><button type="button" onClick={confirm} className={`${buttonBase} mt-3 bg-neutral-950 text-white`}>Confirmar e jogar</button></div>}
    {!searching && !found && <button type="button" disabled={!timeControl || !colorChoice || hasActiveMatch} title={hasActiveMatch ? blockedReason : undefined} onClick={begin} className={`${buttonBase} mt-4 w-full bg-white text-neutral-950 hover:bg-neutral-200`}>Procurar partida</button>}
  </section>;
}
