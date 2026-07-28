import { CircleCheck, CircleX, LoaderCircle, Play } from "lucide-react";
import type { AnalysisJobStatus, StructuralAnalysisResult } from "@/lib/analysis/contracts";
import { isAnalysisActionDisabled } from "@/lib/analysis/ui-state";
import type { AnalysisSelectionType } from "@/store/useFutureAiDemoStore";

const statusLabels: Record<AnalysisJobStatus, string> = {
  idle: "Aguardando início",
  preparing: "Preparando estrutura local…",
  analyzing: "Organizando o job demonstrativo…",
  completed: "Estrutura preparada",
  failed: "Não foi possível preparar a estrutura",
};

type AnalysisActionPanelProps = {
  analysisType: AnalysisSelectionType;
  status: AnalysisJobStatus;
  hasSelection: boolean;
  result: StructuralAnalysisResult | null;
  error: string | null;
  onAnalyze: () => void;
};

export function AnalysisActionPanel({
  analysisType,
  status,
  hasSelection,
  result,
  error,
  onAnalyze,
}: AnalysisActionPanelProps) {
  const running = status === "preparing" || status === "analyzing";
  const buttonLabel = analysisType === "game" ? "Analisar partida" : "Analisar posição";
  return (
    <section aria-labelledby="analysis-action-title" className="rounded-2xl border border-line bg-neutral-50 p-5 shadow-sm">
      <h2 id="analysis-action-title" className="text-lg font-semibold">3. Execute a análise</h2>
      <p className="mt-1 text-sm leading-6 text-muted">
        Nesta etapa, o botão prepara somente a estrutura local do processamento.
      </p>
      <button
        type="button"
        disabled={isAnalysisActionDisabled(status, hasSelection)}
        onClick={onAnalyze}
        className="mt-5 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {running ? <LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> : <Play size={17} aria-hidden="true" />}
        {buttonLabel}
      </button>
      <div aria-live="polite" className="mt-4 rounded-xl border border-line bg-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold">
          {status === "completed" ? <CircleCheck size={17} aria-hidden="true" /> : status === "failed" ? <CircleX size={17} aria-hidden="true" /> : running ? <LoaderCircle className="animate-spin" size={17} aria-hidden="true" /> : null}
          Estado: {statusLabels[status]}
        </div>
        {result && <p className="mt-3 text-sm leading-6">{result.message}</p>}
        {error && <p role="alert" className="mt-3 text-sm font-semibold text-red-800">{error}</p>}
      </div>
      <p className="mt-4 text-xs leading-5 text-muted">
        O Stockfish fará a análise técnica em uma etapa futura. Depois, o Professor IA poderá transformar fatos validados em explicações pedagógicas. Nenhum dos dois é executado agora.
      </p>
    </section>
  );
}
