import type { CountItem } from "./dashboard";

export function FrequentMistakes({ mistakes }: { mistakes: CountItem[] }) {
  const maximum = Math.max(...mistakes.map((item) => item.count), 1);
  return (
    <section aria-labelledby="mistakes-title" className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
      <p className="section-kicker">Pontos de atenção</p>
      <h2 id="mistakes-title" className="text-lg font-semibold text-neutral-950">Erros mais frequentes</h2>
      <p className="mt-1 text-sm text-muted">Categorias identificadas nas análises simuladas.</p>
      <ol className="mt-6 space-y-4">
        {mistakes.map((mistake) => (
          <li key={mistake.name}>
            <div className="mb-1.5 flex items-center justify-between gap-4 text-sm"><span className="font-medium text-neutral-800">{mistake.name}</span><span className="text-muted">{mistake.count}</span></div>
            <div className="h-2 overflow-hidden rounded-full bg-neutral-100"><div className="h-full rounded-full bg-neutral-800" style={{ width: `${(mistake.count / maximum) * 100}%` }} /></div>
          </li>
        ))}
      </ol>
      <p className="mt-5 rounded-xl bg-neutral-100 px-3 py-2 text-xs leading-5 text-neutral-600">Dados simulados para demonstrar a experiência do Dashboard.</p>
    </section>
  );
}
