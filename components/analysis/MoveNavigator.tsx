import { ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";

export function MoveNavigator({ currentPly, totalPlies, onNavigate }: { currentPly: number; totalPlies: number; onNavigate: (ply: number) => void }) {
  const buttonClass = "inline-flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-line bg-white hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus disabled:cursor-not-allowed disabled:opacity-40";
  return <div className="mt-4 flex items-center justify-center gap-2" aria-label="Navegação dos lances">
    <button type="button" className={buttonClass} aria-label="Ir para a posição inicial" disabled={currentPly === 0} onClick={() => onNavigate(0)}><ChevronsLeft size={20} /></button>
    <button type="button" className={buttonClass} aria-label="Ir para o lance anterior" disabled={currentPly === 0} onClick={() => onNavigate(currentPly - 1)}><ChevronLeft size={20} /></button>
    <span className="min-w-24 text-center text-sm font-semibold" aria-live="polite">Lance {currentPly} de {totalPlies}</span>
    <button type="button" className={buttonClass} aria-label="Ir para o próximo lance" disabled={currentPly === totalPlies} onClick={() => onNavigate(currentPly + 1)}><ChevronRight size={20} /></button>
    <button type="button" className={buttonClass} aria-label="Ir para o último lance" disabled={currentPly === totalPlies} onClick={() => onNavigate(totalPlies)}><ChevronsRight size={20} /></button>
  </div>;
}
