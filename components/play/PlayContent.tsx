"use client";
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { MockNotice } from "@/components/MockNotice"; import { PageTitle } from "@/components/PageTitle";
import { availablePlayers, timeControls } from "@/lib/data/play";
import type { AvailablePlayer, DemoColorChoice, DemoMatchConfig, TimeControl } from "@/lib/types/play";
import { hydrateDemoMatchStore, useDemoMatchStore } from "@/store/useDemoMatchStore";
import { DemoMatch } from "./DemoMatch"; import { MatchSetup } from "./MatchSetup"; import { OpenMatchRooms } from "./OpenMatchRooms";

type PlayTab = "setup" | "rooms" | "match";
const tabs: Array<{ id: PlayTab; label: string }> = [{ id: "setup", label: "Preparar partida" }, { id: "rooms", label: "Salas abertas" }, { id: "match", label: "Partida em andamento" }];
export function PlayContent() {
  const hydrated = useDemoMatchStore((state) => state.hydrated); const match = useDemoMatchStore((state) => state.match); const startMatch = useDemoMatchStore((state) => state.startMatch);
  const [tab, setTab] = useState<PlayTab | null>(null); const [opponent, setOpponent] = useState<AvailablePlayer | null>(null); const [timeControl, setTimeControl] = useState<TimeControl | null>(() => timeControls.find((control) => control.id === "10-0") ?? null); const [colorChoice, setColorChoice] = useState<DemoColorChoice | null>("random"); const [randomIndex, setRandomIndex] = useState(0); const refs = useRef<Array<HTMLButtonElement | null>>([]);
  useEffect(() => { void hydrateDemoMatchStore(); }, []);
  const activeTab: PlayTab = tab ?? (match ? "match" : "setup");
  const start = (config: DemoMatchConfig) => { startMatch(config); setTab("match"); };
  const selectTab = (next: PlayTab) => { if (next === "match" && !match) return; setTab(next); };
  const keyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => { const enabled = tabs.filter((item) => item.id !== "match" || match); let current = enabled.findIndex((item) => item.id === tabs[index].id); if (event.key === "ArrowRight") current = (current + 1) % enabled.length; else if (event.key === "ArrowLeft") current = (current - 1 + enabled.length) % enabled.length; else if (event.key === "Home") current = 0; else if (event.key === "End") current = enabled.length - 1; else return; event.preventDefault(); const next = enabled[current]; selectTab(next.id); refs.current[tabs.findIndex((item) => item.id === next.id)]?.focus(); };
  if (!hydrated) return <div className="space-y-7"><PageTitle eyebrow="Partidas" title="Jogar" description="Prepare e teste a futura experiência de partidas entre usuários do TeaChess."/><div role="status" aria-live="polite" className="animate-pulse rounded-2xl border border-line bg-white p-8 text-center"><p className="font-semibold">Restaurando demonstração local…</p><p className="mt-1 text-sm text-muted">Conferindo posição, lances e relógios salvos.</p></div></div>;
  return <div className="space-y-7"><PageTitle eyebrow="Partidas" title="Jogar" description="Prepare e teste a futura experiência de partidas entre usuários do TeaChess."/><MockNotice>Esta é uma demonstração local. Nenhum adversário real está conectado; partidas não alteram rating, ranking ou estatísticas.</MockNotice><div role="tablist" aria-label="Navegação da página Jogar" className="grid grid-cols-1 rounded-xl border border-line bg-white p-1 text-sm font-semibold sm:grid-cols-3">{tabs.map((item, index) => <button key={item.id} ref={(node) => { refs.current[index] = node; }} id={`play-tab-${item.id}`} role="tab" aria-selected={activeTab === item.id} aria-controls={`play-panel-${item.id}`} tabIndex={activeTab === item.id ? 0 : -1} disabled={item.id === "match" && !match} onKeyDown={(event) => keyDown(event, index)} onClick={() => selectTab(item.id)} className={`rounded-lg px-3 py-2.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40 ${activeTab === item.id ? "bg-neutral-950 text-white" : "text-muted hover:bg-neutral-100"}`}>{item.label}</button>)}</div>
    <div id="play-panel-setup" role="tabpanel" aria-labelledby="play-tab-setup" hidden={activeTab !== "setup"}>{activeTab === "setup" && <MatchSetup players={availablePlayers} controls={timeControls} opponent={opponent} timeControl={timeControl} colorChoice={colorChoice} randomIndex={randomIndex} onOpponent={setOpponent} onTimeControl={setTimeControl} onColorChoice={setColorChoice} onStart={start}/>}</div>
    <div id="play-panel-rooms" role="tabpanel" aria-labelledby="play-tab-rooms" hidden={activeTab !== "rooms"}>{activeTab === "rooms" && <OpenMatchRooms randomIndex={randomIndex} onStart={start}/>}</div>
    <div id="play-panel-match" role="tabpanel" aria-labelledby="play-tab-match" hidden={activeTab !== "match"}>{activeTab === "match" && match && <DemoMatch onBack={() => { setTab("setup"); setRandomIndex((value) => value + 1); }}/>}</div>
  </div>;
}
