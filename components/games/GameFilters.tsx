import { Search, SlidersHorizontal, X } from "lucide-react";
import type { GameFilterState } from "./games";

const inputClass = "w-full rounded-xl border border-line bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition focus:border-neutral-600 focus:ring-2 focus:ring-neutral-300";

export function GameFilters({ filters, openings, onChange, onClear }: { filters: GameFilterState; openings: string[]; onChange: (changes: Partial<GameFilterState>) => void; onClear: () => void }) {
  return <section aria-labelledby="game-filters-title" className="rounded-2xl border border-line bg-surface p-4 shadow-sm sm:p-5">
    <div className="mb-4 flex items-center gap-2"><SlidersHorizontal size={18} aria-hidden="true" /><h2 id="game-filters-title" className="font-semibold text-neutral-950">Pesquisar e filtrar</h2></div>
    <label className="relative block"><span className="sr-only">Pesquisar partidas</span><Search size={18} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500" aria-hidden="true" /><input type="search" value={filters.query} onChange={(event) => onChange({ query: event.target.value })} placeholder="Adversário, título, evento, abertura ou tag" className={`${inputClass} pl-10`} /></label>
    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <Select label="Resultado" value={filters.result} onChange={(value) => onChange({ result: value as GameFilterState["result"] })} options={[["all","Todos"],["win","Vitória"],["loss","Derrota"],["draw","Empate"]]} />
      <Select label="Cor" value={filters.color} onChange={(value) => onChange({ color: value as GameFilterState["color"] })} options={[["all","Todas"],["white","Brancas"],["black","Pretas"]]} />
      <Select label="Status da análise" value={filters.analysis} onChange={(value) => onChange({ analysis: value as GameFilterState["analysis"] })} options={[["all","Todos"],["analyzed","Analisada"],["pending","Pendente"],["not_analyzed","Não analisada"]]} />
      <Select label="Abertura" value={filters.opening} onChange={(opening) => onChange({ opening })} options={[["all","Todas"], ...openings.map((opening): [string,string] => [opening, opening])]} />
      <Select label="Ordenar por" value={filters.sort} onChange={(value) => onChange({ sort: value as GameFilterState["sort"] })} options={[["newest","Data mais recente"],["oldest","Data mais antiga"],["rating-desc","Maior rating adversário"],["rating-asc","Menor rating adversário"],["accuracy-desc","Maior precisão"],["accuracy-asc","Menor precisão"]]} />
    </div>
    <button type="button" onClick={onClear} className="mt-4 inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><X size={16} aria-hidden="true" />Limpar filtros</button>
  </section>;
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: [string,string][]; onChange: (value: string) => void }) {
  return <label className="text-xs font-semibold text-neutral-700"><span className="mb-1.5 block">{label}</span><select value={value} onChange={(event) => onChange(event.target.value)} className={inputClass}>{options.map(([optionValue, optionLabel]) => <option value={optionValue} key={optionValue}>{optionLabel}</option>)}</select></label>;
}
