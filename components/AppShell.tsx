"use client";
import { useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { Header } from "./Header";
import { MobileNavigation } from "./MobileNavigation";

export function AppShell({ children }: { children: React.ReactNode }) { const [menuOpen,setMenuOpen]=useState(false); useEffect(()=>{document.body.style.overflow=menuOpen?"hidden":"";return()=>{document.body.style.overflow=""}},[menuOpen]); return <div className="min-h-screen"><AppSidebar/><div className="min-h-screen lg:pl-72"><Header menuOpen={menuOpen} onMenuToggle={()=>setMenuOpen(v=>!v)}/><main className="chess-grid min-h-[calc(100vh-4.5rem)] px-4 py-7 sm:px-7 sm:py-9 lg:px-10"><div className="mx-auto max-w-6xl">{children}</div></main></div><MobileNavigation open={menuOpen} onClose={()=>setMenuOpen(false)}/></div>; }
