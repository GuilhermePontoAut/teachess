"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import { navigationItems } from "./navigation";

export function AppSidebar() {
  const pathname = usePathname();
  return <aside className="fixed inset-y-0 left-0 z-30 hidden w-72 flex-col border-r border-neutral-800 bg-sidebar px-5 py-7 lg:flex"><Brand /><nav aria-label="Navegação principal" className="mt-10 flex-1"><p className="mb-3 px-3 text-[10px] font-bold tracking-[.16em] text-sidebar-muted uppercase">Menu principal</p><ul className="space-y-1">{navigationItems.map(({ href,label,icon:Icon,future }) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <li key={href}><Link href={href} aria-current={active ? "page" : undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white ${active ? "bg-white text-neutral-950 shadow-lg shadow-black/20" : "text-neutral-300 hover:bg-white/10 hover:text-white"}`}><Icon size={19} aria-hidden="true" /><span>{label}</span>{future && <span className={`ml-auto rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${active ? "bg-neutral-200 text-neutral-700" : "bg-white/10 text-neutral-400"}`}>Em breve</span>}</Link></li>;})}</ul></nav><div className="rounded-2xl border border-white/15 bg-white/5 p-4"><p className="text-sm font-semibold text-white">Seu próximo lance</p><p className="mt-1 text-xs leading-5 text-neutral-400">Explore uma área e mantenha o aprendizado em movimento.</p></div></aside>;
}
