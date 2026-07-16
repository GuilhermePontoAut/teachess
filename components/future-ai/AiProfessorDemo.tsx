"use client";
import { LoaderCircle, RotateCcw, Send } from "lucide-react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { mockAnalyses } from "@/lib/data/analyses";
import { currentUser } from "@/lib/data/users";
import { getSuggestedQuestions, type DemoContextData, type FutureAiContextRef, type FutureAiContextType } from "@/lib/future-ai/demo";
import {
  buildAuthorizedProfessorContext,
  isProfessorApiSuccess,
  PROFESSOR_REQUEST_TIMEOUT_MS,
  sanitizeProfessorAnswerForDisplay,
} from "@/lib/future-ai/professor";
import { hydrateFutureAiDemoStore, useFutureAiDemoStore } from "@/store/useFutureAiDemoStore";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { hydrateUploadStore, useUploadStore } from "@/store/useUploadStore";
import { ContextSelector } from "./ContextSelector";
import { NewConversationDialog } from "./NewConversationDialog";
import { ProfessorConversation } from "./ProfessorAnswer";

export function AiProfessorDemo() {
  const gamesState = useGameStore((state) => state.games); const uploadsState = useUploadStore((state) => state.uploads); const interactions = useFutureAiDemoStore((state) => state.interactions); const addInteraction = useFutureAiDemoStore((state) => state.addInteraction); const clearConversation = useFutureAiDemoStore((state) => state.clearConversation);
  const [hydrated, setHydrated] = useState(false); const [restored, setRestored] = useState(false); const [context, setContext] = useState<FutureAiContextRef | null>(null); const [question, setQuestion] = useState(""); const [error, setError] = useState(""); const [loading, setLoading] = useState(false); const [confirmOpen, setConfirmOpen] = useState(false); const requestInFlight = useRef(false); const activeController = useRef<AbortController | null>(null);
  const scrollSnapshot = useRef<{ anchor: Element | null; anchorTop: number; scrollTop: number } | null>(null);
  const captureScroll = () => { const anchor = document.elementFromPoint(window.innerWidth / 2, Math.min(window.innerHeight / 2, window.innerHeight - 1)); scrollSnapshot.current = { anchor, anchorTop: anchor?.getBoundingClientRect().top ?? 0, scrollTop: window.scrollY }; };
  useLayoutEffect(() => { const snapshot = scrollSnapshot.current; if (!snapshot) return; scrollSnapshot.current = null; const scrollingElement = document.scrollingElement; if (!scrollingElement) return; const anchorConnected = Boolean(snapshot.anchor?.isConnected); const anchorDelta = anchorConnected && snapshot.anchor ? snapshot.anchor.getBoundingClientRect().top - snapshot.anchorTop : 0; const targetScrollTop = anchorConnected ? scrollingElement.scrollTop + anchorDelta : snapshot.scrollTop; const previousBehavior = scrollingElement instanceof HTMLElement ? scrollingElement.style.scrollBehavior : ""; if (scrollingElement instanceof HTMLElement) scrollingElement.style.scrollBehavior = "auto"; scrollingElement.scrollTop = targetScrollTop; if (scrollingElement instanceof HTMLElement) scrollingElement.style.scrollBehavior = previousBehavior; }, [hydrated, interactions, loading, restored]);
  useEffect(() => { let active = true; void Promise.all([hydrateGameStore(), hydrateUploadStore(), hydrateFutureAiDemoStore()]).finally(() => { if (active) { captureScroll(); setHydrated(true); setRestored(useFutureAiDemoStore.getState().interactions.length > 0); } }); return () => { active = false; activeController.current?.abort(); }; }, []);
  const games = useMemo(() => gamesState.filter((game) => game.ownerUserId === currentUser.id && game.playerUserId === currentUser.id), [gamesState]);
  const gameIds = useMemo(() => new Set(games.map((game) => game.id)), [games]);
  const analyses = useMemo(() => mockAnalyses.filter((analysis) => gameIds.has(analysis.gameId)), [gameIds]);
  const positions = useMemo(() => uploadsState.filter((upload) => upload.ownerUserId === currentUser.id), [uploadsState]);
  const selectedData = useMemo<DemoContextData>(() => { if (!context) return {}; if (context.type === "game-analysis") { const game = games.find((item) => item.id === context.id); return { game, analysis: game ? analyses.find((item) => item.gameId === game.id) : undefined }; } if (context.type === "saved-position") return { position: positions.find((item) => item.id === context.id) }; return {}; }, [analyses, context, games, positions]);
  const suggestions = context && !context.legacy ? getSuggestedQuestions(context.type as FutureAiContextType) : [];
  const generate = async () => {
    if (requestInFlight.current) return;
    const trimmed = question.trim();
    if (!context || !context.id || context.legacy) {
      setError("Escolha uma análise de partida ou posição específica antes de consultar o Professor IA.");
      return;
    }
    if (!trimmed) {
      setError("Escreva ou selecione uma pergunta antes de continuar.");
      return;
    }

    const authorizedContext = buildAuthorizedProfessorContext(
      context,
      selectedData.game,
      selectedData.position,
      currentUser.id,
    );
    if (!authorizedContext) {
      setError("O contexto selecionado não está mais disponível. Selecione-o novamente.");
      return;
    }

    const controller = new AbortController();
    activeController.current = controller;
    requestInFlight.current = true;
    captureScroll();
    setError("");
    setLoading(true);
    let timedOut = false;
    const timeout = window.setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, PROFESSOR_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch("/api/ai/professor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, authorizedContext }),
        signal: controller.signal,
      });
      const payload: unknown = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 503) {
          throw new Error("O Professor IA não está configurado ou está temporariamente indisponível.");
        }
        if (response.status === 403) {
          throw new Error("A partida selecionada não está autorizada para esta consulta.");
        }
        if (response.status === 400) {
          throw new Error("Não foi possível preparar o contexto selecionado para a consulta.");
        }
        throw new Error("Não foi possível consultar o Professor IA neste momento.");
      }
      if (!isProfessorApiSuccess(payload)) {
        throw new Error("O Professor IA retornou uma resposta que não pôde ser exibida.");
      }

      captureScroll();
      addInteraction({
        id: `future-ai-${Date.now()}`,
        question: trimmed,
        context,
        answer: sanitizeProfessorAnswerForDisplay(payload.data, context.id),
        toolDecision: payload.toolDecision,
        createdAt: new Date().toISOString(),
      });
      setQuestion("");
      setRestored(false);
    } catch (requestError: unknown) {
      const message = timedOut
        ? "A consulta ao Professor IA demorou mais que o esperado. Tente novamente."
        : requestError instanceof TypeError
          ? "Não foi possível consultar o Professor IA por um erro de rede. Verifique sua conexão e tente novamente."
        : requestError instanceof Error && requestError.name !== "AbortError"
          ? requestError.message
          : "Não foi possível consultar o Professor IA por um erro de rede.";
      setError(message);
    } finally {
      window.clearTimeout(timeout);
      if (activeController.current === controller) activeController.current = null;
      requestInFlight.current = false;
      setLoading(false);
    }
  };
  if (!hydrated) return <div role="status" aria-live="polite" className="animate-pulse rounded-2xl border border-line bg-white p-8"><div className="h-5 w-56 rounded bg-neutral-200"/><div className="mt-4 h-40 rounded-xl bg-neutral-100"/><span className="sr-only">Carregando demonstração local…</span></div>;
  return <div className="space-y-5">{restored && <p role="status" className="rounded-xl border border-line bg-neutral-100 p-3 text-sm font-semibold">Histórico restaurado deste navegador. Novas perguntas são enviadas com o contexto selecionado ao Professor IA.</p>}<div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(280px,.72fr)_minmax(0,1.45fr)]"><ContextSelector selected={context} games={games} analyses={analyses} positions={positions} onSelect={(next) => { setContext(next); setQuestion(""); setError(""); }} /><section aria-labelledby="demo-conversation-title" className="min-w-0 rounded-2xl border border-line bg-neutral-50 p-4 shadow-sm sm:p-5"><div className="flex flex-wrap items-start justify-between gap-3"><div><h2 id="demo-conversation-title" className="text-lg font-semibold">2. Faça uma pergunta</h2><p className="mt-1 text-sm text-muted">A pergunta e somente o contexto selecionado são enviados ao servidor.</p></div><button type="button" disabled={loading} onClick={() => interactions.length ? setConfirmOpen(true) : clearConversation()} className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-line bg-white px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"><RotateCcw size={16} />Nova conversa</button></div>{context && suggestions.length > 0 && <div className="mt-4"><p className="text-sm font-semibold">Perguntas sugeridas</p><div className="mt-2 flex flex-wrap gap-2">{suggestions.map((item) => <button key={item} type="button" disabled={loading} onClick={() => { setQuestion(item); setError(""); }} className="rounded-full border border-line bg-white px-3 py-2 text-left text-xs font-semibold hover:border-neutral-950 focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60">{item}</button>)}</div></div>}<label htmlFor="future-ai-question" className="mt-5 block text-sm font-semibold">Sua pergunta</label><textarea id="future-ai-question" value={question} disabled={loading} onChange={(event) => { setQuestion(event.target.value.slice(0, 500)); setError(""); }} onKeyDown={(event) => { if ((event.ctrlKey || event.metaKey) && event.key === "Enter") void generate(); }} rows={3} placeholder={context ? "Escreva uma dúvida sobre o contexto selecionado…" : "Escolha primeiro um contexto…"} className="mt-2 w-full resize-y rounded-xl border border-line bg-white px-3 py-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"/><div className="mt-2 flex flex-wrap items-center justify-between gap-2"><span className="text-xs text-muted">{question.length}/500 · Ctrl/⌘ + Enter</span><button type="button" disabled={loading} onClick={() => { void generate(); }} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">{loading ? <LoaderCircle className="animate-spin" size={17} /> : <Send size={17} />}{loading ? "Consultando Professor IA..." : "Perguntar ao Professor IA"}</button></div>{error && <p role="alert" className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-800">{error}</p>}<div id="conversation-history" className="mt-6 scroll-mt-24 border-t border-line pt-5"><ProfessorConversation interactions={interactions} /></div></section></div><NewConversationDialog open={confirmOpen} onCancel={() => setConfirmOpen(false)} onConfirm={() => { clearConversation(); setConfirmOpen(false); setRestored(false); setError(""); }} /></div>;
}
