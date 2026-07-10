"use client";
import { Menu, X } from "lucide-react";
import { usePathname } from "next/navigation";
import { navigationItems } from "./navigation";

export function Header({ menuOpen, onMenuToggle }: { menuOpen: boolean; onMenuToggle: () => void }) {
  const pathname = usePathname(); const current = navigationItems.find(({href}) => href === "/" ? pathname === "/" : pathname.startsWith(href));
  return <header className="sticky top-0 z-20 flex h-18 items-center justify-between border-b border-line bg-white/90 px-4 backdrop-blur-xl sm:px-7 lg:px-10"><div className="flex items-center gap-3"><button type="button" onClick={onMenuToggle} aria-label={menuOpen ? "Fechar menu" : "Abrir menu"} aria-expanded={menuOpen} aria-controls="mobile-navigation" className="flex size-10 items-center justify-center rounded-xl border border-line text-neutral-700 transition hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus lg:hidden">{menuOpen ? <X size={20} /> : <Menu size={20} />}</button><div><p className="text-[10px] font-bold tracking-[.14em] text-muted uppercase">TeaChess</p><p className="text-sm font-semibold text-neutral-800">{current?.label ?? "Área de estudos"}</p></div></div><div className="flex items-center gap-3"><div className="hidden text-right sm:block"><p className="text-sm font-semibold text-neutral-800">Visitante</p><p className="text-xs text-muted">Nível iniciante</p></div><div aria-hidden="true" className="flex size-10 items-center justify-center rounded-full bg-neutral-950 text-sm font-bold text-white ring-4 ring-neutral-100">TC</div></div></header>;
}
