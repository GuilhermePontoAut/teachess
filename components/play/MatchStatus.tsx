import type { DemoMatchConfig, DemoMove, MatchResult } from "@/lib/types/play";
import { currentUser } from "@/lib/data/users";
import { reasonLabels } from "./play";

export function MatchStatus({ config, moves, inCheck, result }: { config: DemoMatchConfig; moves: DemoMove[]; inCheck: boolean; result: MatchResult | null }) {
  const user = { name: currentUser.name, rating: currentUser.currentPlatformRating };
  const opponent = { name: config.opponent.name, rating: config.opponent.currentPlatformRating };
  const white = config.userColor === "white" ? user : opponent;
  const black = config.userColor === "black" ? user : opponent;
  const state = result ? "Finalizada" : inCheck ? "Em xeque" : "Em andamento";
  return <section aria-labelledby="match-info-title" className="rounded-2xl border border-line bg-surface p-4"><div className="flex items-center justify-between gap-3"><h2 id="match-info-title" className="font-semibold">Informações da partida</h2><span className="rounded-full border border-line bg-neutral-100 px-2.5 py-1 text-xs font-bold">DEMONSTRAÇÃO</span></div><dl className="mt-4 grid grid-cols-2 gap-3 text-sm"><Item label="Brancas" value={`${white.name} (${white.rating})`}/><Item label="Pretas" value={`${black.name} (${black.rating})`}/><Item label="Tempo" value={`${config.timeControl.minutes} + ${config.timeControl.increment} · ${config.timeControl.category}`}/><Item label="Sua cor" value={config.userColor === "white" ? "Brancas" : "Pretas"}/><Item label="Estado" value={result ? `${state} · ${reasonLabels[result.reason]}` : state}/><Item label="Lances" value={String(Math.ceil(moves.length / 2))}/></dl><p aria-live="polite" className="mt-4 rounded-xl bg-neutral-100 p-3 text-sm font-medium">Estado atual: {state}{inCheck && !result ? ". O rei está em xeque." : "."}</p></section>;
}

function Item({ label, value }: { label: string; value: string }) { return <div><dt className="text-xs text-muted">{label}</dt><dd className="mt-0.5 font-medium">{value}</dd></div>; }
