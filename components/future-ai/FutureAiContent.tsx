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
export function FutureAiContent() { const [tab, setTab] = useState<FutureAiTab>("professor"); return <div className="space-y-7"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageTitle eyebrow="Professor digital" title="Professor IA" description="Converse com o Professor IA sobre uma partida ou posição selecionada."/><span className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-bold text-white"><Bot size={14} aria-hidden="true"/>Integração ativa</span></div><MockNotice>O Professor IA usa uma integração real com a OpenAI. Os dados de partidas, análises e posições continuam demonstrativos e não incluem avaliação de motor de xadrez.</MockNotice><div className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-sm leading-6"><ShieldAlert className="mt-0.5 shrink-0" size={19} aria-hidden="true"/><p><strong>Protótipo local.</strong> A pergunta e somente o snapshot do contexto selecionado são enviados pelo servidor. A chave não chega ao navegador; autenticação e autorização server-side reais ainda não existem.</p></div><FutureAiNavigation active={tab} onChange={setTab}/><div id={`future-ai-panel-${tab}`} role="tabpanel" aria-labelledby={`future-ai-tab-${tab}`} tabIndex={0} className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus">{tab === "professor" && <AiProfessorDemo/>}{tab === "capabilities" && <AiCapabilities/>}{tab === "architecture" && <FutureArchitecture/>}{tab === "roadmap" && <FutureRoadmap/>}</div></div>; }
