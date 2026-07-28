import { FileSearch, ImageIcon, LockKeyhole } from "lucide-react";
import { OriginBadge } from "@/components/games/OriginBadge";
import type { ChessGame, UploadedPosition } from "@/lib/types/chess";
import type { AnalysisSelectionType } from "@/store/useFutureAiDemoStore";

const analysisTypeLabels: Record<AnalysisSelectionType, string> = {
  game: "Análise de partida",
  position: "Análise de posição",
};
const resultLabels = { win: "Vitória", loss: "Derrota", draw: "Empate" } as const;

type ContextSelectorProps = {
  analysisType: AnalysisSelectionType;
  selectedGameId: string | null;
  selectedPositionId: string | null;
  games: ChessGame[];
  positions: UploadedPosition[];
  disabled?: boolean;
  onTypeChange: (type: AnalysisSelectionType) => void;
  onGameSelect: (gameId: string) => void;
  onPositionSelect: (positionId: string) => void;
};

export function ContextSelector({
  analysisType,
  selectedGameId,
  selectedPositionId,
  games,
  positions,
  disabled = false,
  onTypeChange,
  onGameSelect,
  onPositionSelect,
}: ContextSelectorProps) {
  const itemsAvailable = analysisType === "game" ? games.length > 0 : positions.length > 0;
  return (
    <div className="space-y-5">
      <section aria-labelledby="analysis-type-title" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 id="analysis-type-title" className="text-lg font-semibold">1. Escolha o tipo de análise</h2>
        <p className="mt-1 text-sm leading-6 text-muted">Comece por uma partida completa ou por uma posição salva.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {([
            { id: "game", icon: FileSearch },
            { id: "position", icon: ImageIcon },
          ] as const).map(({ id, icon: Icon }) => (
            <button
              key={id}
              type="button"
              disabled={disabled}
              aria-pressed={analysisType === id}
              aria-label={analysisTypeLabels[id]}
              onClick={() => onTypeChange(id)}
              className={`flex min-h-11 items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${analysisType === id ? "border-neutral-950 bg-neutral-950 text-white" : "border-line hover:bg-neutral-50"}`}
            >
              <Icon size={17} aria-hidden="true" />
              {analysisTypeLabels[id]}
            </button>
          ))}
        </div>
      </section>

      <section aria-labelledby="analysis-item-title" className="rounded-2xl border border-line bg-white p-5 shadow-sm">
        <h2 id="analysis-item-title" className="text-lg font-semibold">
          2. Selecione {analysisType === "game" ? "uma partida" : "uma posição"}
        </h2>
        <p className="mt-1 text-sm leading-6 text-muted">
          {analysisType === "game"
            ? "Partidas disponíveis no seu histórico demonstrativo."
            : "Posições privadas disponíveis no seu histórico demonstrativo."}
        </p>
        {!itemsAvailable && (
          <div role="status" className="mt-4 rounded-xl border border-dashed border-line-strong p-5 text-center">
            <p className="font-semibold">Dados indisponíveis</p>
            <p className="mt-1 text-sm text-muted">Não há itens nesta categoria.</p>
          </div>
        )}
        <div className="mt-4 max-h-[32rem] space-y-2 overflow-y-auto">
          {analysisType === "game" &&
            games.map((game) => (
              <button
                key={game.id}
                type="button"
                disabled={disabled}
                aria-pressed={selectedGameId === game.id}
                onClick={() => onGameSelect(game.id)}
                className={`w-full rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${selectedGameId === game.id ? "border-neutral-950 bg-neutral-100" : "border-line"}`}
              >
                <span className="font-semibold">{game.title}</span>
                <span className="mt-2 flex flex-wrap gap-2">
                  <OriginBadge origin={game.origin} />
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold">{resultLabels[game.result]}</span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-muted">vs. {game.opponent} · {new Date(`${game.date}T12:00:00`).toLocaleDateString("pt-BR")}</span>
              </button>
            ))}
          {analysisType === "position" &&
            positions.map((position) => (
              <button
                key={position.id}
                type="button"
                disabled={disabled}
                aria-pressed={selectedPositionId === position.id}
                onClick={() => onPositionSelect(position.id)}
                className={`w-full rounded-xl border p-3 text-left focus-visible:outline-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-60 ${selectedPositionId === position.id ? "border-neutral-950 bg-neutral-100" : "border-line"}`}
              >
                <span className="font-semibold">{position.title}</span>
                <span className="mt-2 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-semibold text-white"><LockKeyhole size={12} />Privada</span>
                  <span className="rounded-full border border-line px-2.5 py-1 text-xs font-semibold">{position.simulatedDetectedFen ? "FEN demonstrativo disponível" : "Sem FEN demonstrativo"}</span>
                </span>
                <span className="mt-2 block text-xs leading-5 text-muted">{position.description || "Sem contexto informado"}</span>
                <span className="mt-1 block text-xs font-medium text-muted">O FEN é demonstrativo e não foi extraído realmente da imagem.</span>
              </button>
            ))}
        </div>
      </section>
    </div>
  );
}
