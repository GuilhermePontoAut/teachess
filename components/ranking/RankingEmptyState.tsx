import { SearchX, Trophy } from "lucide-react";

export function RankingEmptyState({ filtered, onClear }: { filtered: boolean; onClear?: () => void }) {
  const Icon = filtered ? SearchX : Trophy;
  return <section className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-14 text-center"><Icon className="mx-auto text-neutral-500" size={34} aria-hidden="true" /><h2 className="mt-4 text-lg font-semibold">{filtered ? "Nenhum jogador encontrado" : "Ranking ainda vazio"}</h2><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">{filtered ? "Tente outro nome ou remova alguns filtros para visualizar a comunidade." : "Ainda não há jogadores simulados disponíveis para esta classificação."}</p>{filtered && onClear && <button type="button" onClick={onClear} className="mt-5 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Limpar filtros</button>}</section>;
}
