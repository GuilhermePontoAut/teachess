import Link from "next/link";
import { Crown } from "lucide-react";

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link href="/" aria-label="TeaChess — ir para o Dashboard" className="inline-flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"><span className="flex size-10 items-center justify-center rounded-xl border border-neutral-300 bg-white text-neutral-950 shadow-lg shadow-black/20"><Crown size={22} strokeWidth={2.25} aria-hidden="true" /></span>{!compact && <span><span className="block text-xl font-bold tracking-tight text-white">Tea<span className="text-neutral-400">Chess</span></span><span className="block text-[10px] font-medium tracking-[.18em] text-neutral-400 uppercase">Aprenda. Jogue. Evolua.</span></span>}</Link>;
}
