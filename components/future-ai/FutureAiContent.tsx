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

export function FutureAiContent() {
  const [tab, setTab] = useState<FutureAiTab>("professor");
  return (
    <div className="space-y-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <PageTitle
          eyebrow="Professor digital"
          title="Professor IA"
          description="Prepare a análise automática de uma partida ou posição em três passos."
        />
        <span className="inline-flex w-fit items-center gap-2 rounded-full bg-neutral-950 px-3 py-1.5 text-xs font-bold text-white">
          <Bot size={14} aria-hidden="true" />
          Stockfish local
        </span>
      </div>
      <MockNotice>
        O Stockfish executa no seu navegador e analisa somente a posição FEN
        selecionada. Partidas completas e explicações pedagógicas não fazem
        parte desta etapa.
      </MockNotice>
      <div className="flex gap-3 rounded-2xl border border-line bg-white p-4 text-sm leading-6">
        <ShieldAlert className="mt-0.5 shrink-0" size={19} aria-hidden="true" />
        <p>
          <strong>Processamento isolado.</strong> O Worker e o arquivo WASM são
          servidos pela própria aplicação. Nenhuma posição ou avaliação é
          enviada à OpenAI ou a outro serviço durante a análise.
        </p>
      </div>
      <FutureAiNavigation active={tab} onChange={setTab} />
      <div
        id={`future-ai-panel-${tab}`}
        role="tabpanel"
        aria-labelledby={`future-ai-tab-${tab}`}
        tabIndex={0}
        className="focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-focus"
      >
        {tab === "professor" && <AiProfessorDemo />}
        {tab === "capabilities" && <AiCapabilities />}
        {tab === "architecture" && <FutureArchitecture />}
        {tab === "roadmap" && <FutureRoadmap />}
      </div>
    </div>
  );
}
