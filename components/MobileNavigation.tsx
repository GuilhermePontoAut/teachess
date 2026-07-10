"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "./Brand";
import { navigationItems } from "./navigation";

export function MobileNavigation({ open, onClose }: { open: boolean; onClose: () => void }) { const pathname=usePathname(); if(!open) return null; return <div className="fixed inset-0 z-40 lg:hidden"><button className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" aria-label="Fechar menu" onClick={onClose}/><aside id="mobile-navigation" className="absolute inset-y-0 left-0 w-[min(86vw,20rem)] bg-slate-950 p-5 shadow-2xl"><div className="py-2"><Brand /></div><nav aria-label="Navegação móvel" className="mt-8"><ul className="space-y-1">{navigationItems.map(({href,label,icon:Icon})=>{const active=href==="/"?pathname==="/":pathname.startsWith(href);return <li key={href}><Link href={href} onClick={onClose} aria-current={active?"page":undefined} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium ${active?"bg-emerald-400 text-slate-950":"text-slate-300 hover:bg-white/10 hover:text-white"}`}><Icon size={19} aria-hidden="true"/>{label}</Link></li>})}</ul></nav></aside></div>; }
