import { CircleCheck, CircleX, LoaderCircle, Play, Square } from "lucide-react";
import type { AnalysisJobStatus, PositionAnalysisResult } from "@/lib/analysis/contracts";
import { isAnalysisActionDisabled } from "@/lib/analysis/ui-state";
import type { AnalysisSelectionType } from "@/store/useFutureAiDemoStore";

const statusLabels: Record<AnalysisJobStatus, string> = {
  idle: "Aguardando início",
  preparing: "Preparando estrutura local…",
  analyzing: "Organizando o job demonstrativo…",
  completed: "Análise concluída",
  cancelled: "Análise cancelada",
  failed: "Não foi possível concluir a análise",
};

type AnalysisActionPanelProps = {
  analysisType: AnalysisSelectionType;
  status: AnalysisJobStatus;
  hasSelection: boolean;
  result: PositionAnalysisResult | null;
  error: string | null;
  onAnalyze: () => void;
  onCancel: () => void;
};

export function AnalysisActionPanel({
  analysisType,
  status,
  hasSelection,
  result,
  error,
  onAnalyze,
  onCancel,
}: AnalysisActionPanelProps) {
  const running = status === "preparing" || status === "analyzing";
  const buttonLabel = analysisType === "game" ? "Analisar partida (indisponível)" : "Analisar posição";
  const evaluation = result?.analysis.evaluation;
  const mateIn = result?.analysis.mateIn;
  return (
    <section aria-labelledby="analysis-action-title" className="rounded-2xl border border-line bg-neutral-50 p-5 shadow-sm">
      <h2 id="analysis-action-title" className="text-lg font-semibold">3. Execute a análise</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        O Stockfish analisa localmente somente a FEN selecionada.
      </p>
      <button
        type="button"
        disabled={analysisType === "game" || isAnalysisActionDisabled(status, hasSelection)}
        onClick={onAnalyze}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? <LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
        {buttonLabel}
      </button>
      {running && (
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold"
        >
          <Square size={15} aria-hidden="true" />
          Cancelar análise
        </button>
      )}
      <div aria-live="polite" className="mt-4 rounded-xl border border-line bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {status === "completed" ? <CircleCheck size={17} aria-hidden="true" /> : status === "failed" ? <CircleX size={17} aria-hidden="true" /> : running ? <LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> : null}
          Estado: {statusLabels[status]}
        </div>
        {result && (
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-xs text-muted">Avaliação (brancas)</dt>
              <dd className="font-semibold">
                {mateIn !== null && mateIn !== undefined
                  ? `Mate em ${Math.abs(mateIn)} para ${mateIn > 0 ? "brancas" : "pretas"}`
                  : `${evaluation !== null && evaluation !== undefined && evaluation > 0 ? "+" : ""}${evaluation?.toFixed(2) ?? "—"}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Melhor lance (UCI)</dt>
              <dd className="font-mono font-semibold">{result.analysis.bestMove ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Profundidade</dt>
              <dd className="font-semibold">{result.analysis.engineSettings.depth}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted">Variante principal (UCI)</dt>
              <dd className="break-all font-mono text-xs">
                {result.analysis.principalVariations[0]?.moves.join(" ") || "—"}
              </dd>
            </div>
          </dl>
        )}
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">
        Stockfish 18 lite-single · profundidade 16 · 1 thread · Hash 16 MB · MultiPV 1.
        Valores positivos favorecem as brancas; negativos, as pretas. Não há relatório
        pedagógico, análise de PGN ou envio à OpenAI.
      </p>
    </section>
  );
}
