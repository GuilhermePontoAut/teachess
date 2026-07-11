"use client";
import { Bot, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import type { FutureAiTab } from "@/lib/future-ai/demo";
import { AiCapabilities } from "./AiCapabilities";
import { AiProfessorDemo } from "./AiProfessorDemo";
import { FutureArchitecture } from "./FutureArchitecture";
import { FutureAiNavigation } from "./FutureAiNavigation";
import { FutureRoadmap } from "./FutureRoadmap";
export function FutureAiContent() { const [tab, setTab] = useState<FutureAiTab>("professor"); return <div className="space-y-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageTitle eyebrow="Visão de futuro" title="Futura IA" description="Conheça como o futuro professor digital do TeaChess poderá transformar dados técnicos em explicações didáticas, mantendo o professor humano no processo."/><span className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-bold text-white"><Bot size={14} aria-hidden="true"/>Simulação</span></div><MockNotice>Esta página demonstra uma experiência futura. Nenhum modelo de IA, LLM, motor de xadrez ou serviço externo está integrado. Todas as respostas exibidas são simuladas.</MockNotice><div className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-sm leading-6"><ShieldAlert className="mt-0.5 shrink-0" size={19} aria-hidden="true"/><p><strong>Demonstração local e privada.</strong> Perguntas e histórico ficam apenas neste navegador. A segurança real dependerá de autenticação e validação no backend.</p></div><FutureAiNavigation active={tab} onChange={setTab}/><div id={`future-ai-panel-${tab}`} role="tabpanel" aria-labelledby={`future-ai-tab-${tab}`} tabIndex={0} className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">{tab === "professor" && <AiProfessorDemo/>}{tab === "capabilities" && <AiCapabilities/>}{tab === "architecture" && <FutureArchitecture/>}{tab === "roadmap" && <FutureRoadmap/>}</div></div>; }
