import { FormFieldError } from "./FormFieldError";

export function PgnField({ value, error, onChange }: { value: string; error?: string; onChange: (value: string) => void }) {
  return <div className="sm:col-span-2"><label htmlFor="pgn" className="block text-sm font-semibold text-neutral-900">PGN</label><p id="pgn-help" className="mt-1 text-sm text-muted">Cole a notação da partida. A validação é apenas estrutural e não analisa os lances.</p><textarea id="pgn" rows={7} value={value} onChange={(event) => onChange(event.target.value)} aria-describedby={`pgn-help${error ? " pgn-error" : ""}`} aria-invalid={Boolean(error)} className="mt-2 w-full rounded-xl border border-line bg-white px-3.5 py-3 font-mono text-sm text-neutral-900 shadow-sm outline-none focus:border-neutral-700 focus:ring-2 focus:ring-neutral-300" placeholder="1. e4 e5 2. Nf3 Nc6..." /><FormFieldError id="pgn-error" message={error} /></div>;
}
