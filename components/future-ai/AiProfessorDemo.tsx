"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  completeDemoAnalysis,
  createDemoAnalysisJob,
  transitionAnalysisJob,
} from "@/lib/analysis/demo-job";
import type { AnalysisTarget } from "@/lib/analysis/contracts";
import { currentUser } from "@/lib/data/users";
import {
  hydrateFutureAiDemoStore,
  useFutureAiDemoStore,
} from "@/store/useFutureAiDemoStore";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { hydrateUploadStore, useUploadStore } from "@/store/useUploadStore";
import { AnalysisActionPanel } from "./AnalysisActionPanel";
import { ContextSelector } from "./ContextSelector";

const DEMO_STEP_DELAY_MS = 450;
const DEMO_ERROR_MESSAGE =
  "Não foi possível preparar a estrutura local da análise. Tente novamente.";

export function AiProfessorDemo() {
  const gamesState = useGameStore((state) => state.games);
  const uploadsState = useUploadStore((state) => state.uploads);
  const analysisType = useFutureAiDemoStore((state) => state.analysisType);
  const selectedGameId = useFutureAiDemoStore((state) => state.selectedGameId);
  const selectedPositionId = useFutureAiDemoStore((state) => state.selectedPositionId);
  const currentJob = useFutureAiDemoStore((state) => state.currentJob);
  const lastResult = useFutureAiDemoStore((state) => state.lastResult);
  const error = useFutureAiDemoStore((state) => state.error);
  const selectAnalysisType = useFutureAiDemoStore((state) => state.selectAnalysisType);
  const selectGame = useFutureAiDemoStore((state) => state.selectGame);
  const selectPosition = useFutureAiDemoStore((state) => state.selectPosition);
  const setCurrentJob = useFutureAiDemoStore((state) => state.setCurrentJob);
  const setLastResult = useFutureAiDemoStore((state) => state.setLastResult);
  const setError = useFutureAiDemoStore((state) => state.setError);
  const [hydrated, setHydrated] = useState(false);
  const timers = useRef<number[]>([]);

  useEffect(() => {
    let active = true;
    const activeTimers = timers.current;
    void Promise.all([
      hydrateGameStore(),
      hydrateUploadStore(),
      hydrateFutureAiDemoStore(),
    ]).finally(() => {
      if (active) setHydrated(true);
    });
    return () => {
      active = false;
      activeTimers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const games = useMemo(
    () =>
      gamesState.filter(
        (game) =>
          game.ownerUserId === currentUser.id &&
          game.playerUserId === currentUser.id,
      ),
    [gamesState],
  );
  const positions = useMemo(
    () =>
      uploadsState.filter((upload) => upload.ownerUserId === currentUser.id),
    [uploadsState],
  );
  const selectedPosition = positions.find(
    (position) => position.id === selectedPositionId,
  );
  const hasSelection =
    analysisType === "game"
      ? games.some((game) => game.id === selectedGameId)
      : Boolean(selectedPosition);
  const running =
    currentJob?.status === "preparing" || currentJob?.status === "analyzing";

  const startDemoAnalysis = () => {
    if (!hasSelection || running) return;
    const target: AnalysisTarget =
      analysisType === "game"
        ? { type: "game", gameId: selectedGameId as string }
        : {
            type: "position",
            positionId: selectedPositionId as string,
            fen: selectedPosition?.simulatedDetectedFen ?? null,
          };
    const now = new Date().toISOString();
    let job = createDemoAnalysisJob(
      target,
      now,
      `analysis-job-${Date.now()}`,
    );
    job = transitionAnalysisJob(job, "preparing", now);
    setError(null);
    setLastResult(null);
    setCurrentJob(job);

    // Simulação provisória de UI: não executa engine, LLM, rede ou análise.
    const analyzingTimer = window.setTimeout(() => {
      try {
        job = transitionAnalysisJob(job, "analyzing", new Date().toISOString());
        setCurrentJob(job);
      } catch {
        setError(DEMO_ERROR_MESSAGE);
        setCurrentJob(
          transitionAnalysisJob(job, "failed", new Date().toISOString(), DEMO_ERROR_MESSAGE),
        );
      }
    }, DEMO_STEP_DELAY_MS);
    const completedTimer = window.setTimeout(() => {
      try {
        job = transitionAnalysisJob(job, "completed", new Date().toISOString());
        setCurrentJob(job);
        setLastResult(completeDemoAnalysis(job));
      } catch {
        setError(DEMO_ERROR_MESSAGE);
        if (job.status === "preparing" || job.status === "analyzing") {
          setCurrentJob(
            transitionAnalysisJob(job, "failed", new Date().toISOString(), DEMO_ERROR_MESSAGE),
          );
        }
      }
    }, DEMO_STEP_DELAY_MS * 2);
    timers.current.push(analyzingTimer, completedTimer);
  };

  if (!hydrated) {
    return (
      <div role="status" aria-live="polite" className="animate-pulse rounded-2xl border border-line bg-white p-8">
        <div className="h-5 w-56 rounded bg-neutral-200" />
        <div className="mt-4 h-40 rounded-xl bg-neutral-100" />
        <span className="sr-only">Carregando análise local…</span>
      </div>
    );
  }

  return (
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(300px,.72fr)]">
      <ContextSelector
        analysisType={analysisType}
        selectedGameId={selectedGameId}
        selectedPositionId={selectedPositionId}
        games={games}
        positions={positions}
        disabled={running}
        onTypeChange={selectAnalysisType}
        onGameSelect={selectGame}
        onPositionSelect={selectPosition}
      />
      <AnalysisActionPanel
        analysisType={analysisType}
        status={currentJob?.status ?? "idle"}
        hasSelection={hasSelection}
        result={lastResult}
        error={error}
        onAnalyze={startDemoAnalysis}
      />
    </div>
  );
}
