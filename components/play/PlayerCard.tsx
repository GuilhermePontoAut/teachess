import type { AvailablePlayer } from "@/lib/types/play";
import { getInitials } from "@/components/ranking/ranking";
import { buttonBase, presenceLabels } from "./play";

export function PlayerCard({ player, selected, onSelect }: { player: AvailablePlayer; selected: boolean; onSelect: () => void }) {
  const available = player.presence === "available";
  return <article className={`rounded-2xl border p-4 transition ${selected ? "border-neutral-950 bg-neutral-100 ring-1 ring-neutral-950" : "border-line bg-white"}`}>
    <div className="flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-neutral-950 text-xs font-bold text-white" aria-hidden="true">{getInitials(player.name)}</span><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{player.name}</h3><p className="text-sm text-muted">{player.region} · {player.currentPlatformRating}</p></div><span className={`rounded-full border px-2 py-1 text-xs font-semibold ${available ? "border-neutral-400 bg-neutral-50" : "border-neutral-200 bg-neutral-100 text-muted"}`}><span aria-hidden="true">{available ? "●" : "○"}</span> {presenceLabels[player.presence]}</span></div>
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-line pt-3"><p className="text-xs text-muted">Prefere {player.preferredTime}</p><button type="button" disabled={!available} onClick={onSelect} aria-pressed={selected} className={`${buttonBase} border border-line bg-white py-2 hover:bg-neutral-100`}>{selected ? "Selecionado" : available ? "Selecionar" : "Indisponível"}</button></div>
  </article>;
}
