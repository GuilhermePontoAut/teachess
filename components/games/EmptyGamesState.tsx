import { SearchX, Swords } from "lucide-react";
import Link from "next/link";

export function EmptyGamesState({ filtered }: { filtered: boolean }) {
  const Icon = filtered ? SearchX : Swords;
  return <section className="rounded-2xl border border-dashed border-line-strong bg-surface px-6 py-14 text-center"><Icon className="mx-auto text-neutral-400" size={36} aria-hidden="true" /><h2 className="mt-4 text-lg font-semibold text-neutral-950">{filtered ? "Nenhuma partida encontrada para os filtros selecionados" : "Nenhuma partida cadastrada"}</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">{filtered ? "Ajuste ou limpe os filtros para visualizar outras partidas." : "Adicione uma partida ou restaure os dados de demonstração para começar."}</p>{!filtered && <Link href="/partidas/nova" className="mt-5 inline-flex rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus">Nova partida</Link>}</section>;
}
