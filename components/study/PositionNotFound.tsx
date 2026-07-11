import Link from "next/link";
import { SearchX } from "lucide-react";

export function PositionNotFound() { return <section className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-16 text-center"><SearchX className="mx-auto text-neutral-400" size={40}/><h1 className="mt-4 text-2xl font-semibold">Posição não encontrada</h1><p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-muted">Ela pode ter sido excluída, pertencer a outro usuário ou não existir neste navegador.</p><Link href="/enviar-imagem#meus-envios" className="mt-6 inline-flex rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white">Voltar a Meus envios</Link></section>; }
