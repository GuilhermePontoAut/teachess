"use client";
import { useEffect, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import { availablePlayers, timeControls } from "@/lib/data/play";
import type { AvailablePlayer, DemoColorChoice, DemoMatchConfig, TimeControl } from "@/lib/types/play";
import { DemoMatch } from "./DemoMatch";
import { MatchSetup } from "./MatchSetup";

const SESSION_KEY = "teachess-demo-match-active";

export function PlayContent() {
  const [opponent, setOpponent] = useState<AvailablePlayer | null>(null);
  const [timeControl, setTimeControl] = useState<TimeControl | null>(() => timeControls.find((control) => control.id === "10-0") ?? null);
  const [colorChoice, setColorChoice] = useState<DemoColorChoice | null>("random");
  const [randomIndex, setRandomIndex] = useState(0);
  const [match, setMatch] = useState<DemoMatchConfig | null>(null);
  const [lostSession, setLostSession] = useState(false);
  useEffect(() => {
    if (sessionStorage.getItem(SESSION_KEY) !== "1") return;
    sessionStorage.removeItem(SESSION_KEY);
    const timeout = window.setTimeout(() => setLostSession(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);
  const start = (config: DemoMatchConfig) => { sessionStorage.setItem(SESSION_KEY, "1"); setLostSession(false); setMatch(config); };
  const back = () => { sessionStorage.removeItem(SESSION_KEY); setMatch(null); setRandomIndex((value) => value + 1); };
  return <div className="space-y-7"><PageTitle eyebrow="Partidas" title="Jogar" description="Prepare e teste a futura experiência de partidas entre usuários do TeaChess."/><MockNotice>Esta é uma demonstração local da futura experiência multiplayer. Nenhum adversário real está conectado, e esta partida não altera rating, ranking ou estatísticas oficiais.</MockNotice>
    {lostSession && !match && <div role="status" className="rounded-2xl border border-line bg-neutral-100 p-4 text-sm"><strong>Sessão de demonstração reiniciada.</strong> Partidas e relógios locais não são persistidos apó atualizar a página.</div>}
    <nav aria-label="Etapas da partida" className="flex rounded-xl border border-line bg-white p-1 text-sm font-semibold"><span aria-current={!match ? "step" : undefined} className={`flex-1 rounded-lg px-3 py-2 text-center ${!match ? "bg-neutral-950 text-white" : "text-muted"}`}>1. Preparar partida</span><span aria-current={match ? "step" : undefined} className={`flex-1 rounded-lg px-3 py-2 text-center ${match ? "bg-neutral-950 text-white" : "text-muted"}`}>2. Partida em andamento</span></nav>
    {match ? <DemoMatch config={match} onBack={back}/> : <MatchSetup players={availablePlayers} controls={timeControls} opponent={opponent} timeControl={timeControl} colorChoice={colorChoice} randomIndex={randomIndex} onOpponent={setOpponent} onTimeControl={setTimeControl} onColorChoice={setColorChoice} onStart={start}/>}</div>;
}
