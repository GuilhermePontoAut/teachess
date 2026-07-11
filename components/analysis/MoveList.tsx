import type { ReplayMove } from "@/lib/utils/analysis";

export function MoveList({ moves, currentPly, criticalPlies, onNavigate }: { moves: ReplayMove[]; currentPly: number; criticalPlies: Set<number>; onNavigate: (ply: number) => void }) {
  const rows = Array.from({ length: Math.ceil(moves.length / 2) }, (_, index) => ({ number: index + 1, white: moves[index * 2], black: moves[index * 2 + 1] }));
  return <section className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5" aria-labelledby="move-list-title"><h2 id="move-list-title" className="text-lg font-semibold">Lista de lances</h2><p className="mt-1 text-sm text-muted">Selecione um lance para atualizar o tabuleiro.</p>
    {rows.length ? <ol className="mt-4 max-h-[34rem] overflow-y-auto rounded-xl border border-line" aria-label="Lances da partida">{rows.map((row) => <li key={row.number} className="grid grid-cols-[3rem_1fr_1fr] border-b border-line last:border-b-0"><span className="px-3 py-2.5 text-sm text-muted">{row.number}.</span><MoveButton move={row.white} currentPly={currentPly} criticalPlies={criticalPlies} onNavigate={onNavigate} /><MoveButton move={row.black} currentPly={currentPly} criticalPlies={criticalPlies} onNavigate={onNavigate} /></li>)}</ol> : <p className="mt-4 rounded-xl bg-neutral-100 p-4 text-sm text-muted">Nenhum lance disponível.</p>}
  </section>;
}

function MoveButton({ move, currentPly, criticalPlies, onNavigate }: { move?: ReplayMove; currentPly: number; criticalPlies: Set<number>; onNavigate: (ply: number) => void }) {
  if (!move) return <span />;
  const active = currentPly === move.ply;
  const critical = criticalPlies.has(move.ply);
  return <button type="button" onClick={() => onNavigate(move.ply)} aria-label={`Ir para ${move.color === "white" ? "o lance das brancas" : "o lance das pretas"} ${move.moveNumber}: ${move.san}${critical ? ", momento crítico simulado" : ""}`} aria-current={active ? "step" : undefined} className={`m-1 rounded-lg px-3 py-2 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus ${active ? "bg-neutral-950 text-white" : critical ? "border border-dashed border-neutral-500 bg-neutral-100" : "hover:bg-neutral-100"}`}>{move.san}{critical && <span className="sr-only"> — crítico</span>}</button>;
}
