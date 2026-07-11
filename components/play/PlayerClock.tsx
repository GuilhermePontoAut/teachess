import { Clock3 } from "lucide-react";
import { formatClock } from "./play";

export function PlayerClock({ name, rating, milliseconds, active, color }: { name: string; rating: number; milliseconds: number; active: boolean; color: "white" | "black" }) {
  const critical = milliseconds <= 10_000;
  const warning = milliseconds <= 30_000;
  return <div className={`flex items-center justify-between gap-3 rounded-xl border p-3 ${active ? "border-neutral-950 bg-neutral-100 ring-1 ring-neutral-950" : "border-line bg-white"}`} aria-label={`Relógio de ${name}, ${formatClock(milliseconds)} restantes${active ? ", em contagem" : ", parado"}`}><div className="flex min-w-0 items-center gap-3"><span className={`size-3 shrink-0 rounded-full border ${color === "white" ? "border-neutral-500 bg-white" : "border-neutral-950 bg-neutral-950"}`} aria-hidden="true"/><div className="min-w-0"><p className="truncate text-sm font-semibold">{name}</p><p className="text-xs text-muted">Rating {rating} · {active ? "Relógio ativo" : "Aguardando"}</p></div></div><div className={`flex items-center gap-2 font-mono text-xl font-bold tabular-nums ${critical ? "text-red-700" : warning ? "text-amber-700" : "text-neutral-950"}`}><Clock3 size={17} aria-hidden="true"/><span>{formatClock(milliseconds)}</span>{critical && <span className="sr-only">Atenção: menos de dez segundos</span>}</div></div>;
}
