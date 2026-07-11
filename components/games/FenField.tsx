import { FormFieldError } from "./FormFieldError";

export function FenField({ value, error, onChange }: { value: string; error?: string; onChange: (value: string) => void }) {
  return <div className="sm:col-span-2"><label htmlFor="fen" className="block text-sm font-semibold text-neutral-900">FEN inicial ou posição crítica</label><p id="fen-help" className="mt-1 text-sm text-muted">Opcional. Informe uma posição completa em FEN; nenhuma análise será executada.</p><textarea id="fen" rows={3} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={`fen-help${error ? " fen-error" : ""}`} aria-invalid={Boolean(error)} className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 font-mono text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-700 focus:ring-2 focus:ring-neutral-300" placeholder="rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1" /><FormFieldError id="fen-error" message={error} /></div>;
}
