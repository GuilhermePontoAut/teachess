import type { CountItem } from "./dashboard";

export function PopularOpenings({ openings }: { openings: CountItem[] }) {
  return (
    <section aria-labelledby="openings-title" className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <p className="section-kicker">Repertório</p>
      <h2 id="openings-title" className="text-lg font-semibold text-neutral-950">Aberturas mais jogadas</h2>
      <p className="mt-1 text-sm text-muted">Frequência calculada a partir do seu histórico.</p>
      <ol className="mt-5 divide-y divide-neutral-200">
        {openings.map((opening, index) => (
          <li key={opening.name} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-neutral-100 text-xs font-bold text-neutral-600">{index + 1}</span>
            <span className="min-w-0 flex-1 text-sm font-medium text-neutral-800">{opening.name}</span>
            <span className="rounded-full border border-line bg-surface-subtle px-2.5 py-1 text-xs font-semibold text-neutral-600">{opening.count} {opening.count === 1 ? "partida" : "partidas"}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
