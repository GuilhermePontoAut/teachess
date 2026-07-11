import { Flag, Handshake, RotateCcw, Shuffle, Trash2, Undo2 } from "lucide-react";
import { buttonBase } from "./play";

export function MatchControls({ finished, onFlip, onDraw, onResign, onRestart, onBack, onDelete }: { finished: boolean; onFlip: () => void; onDraw: () => void; onResign: () => void; onRestart: () => void; onBack: () => void; onDelete: () => void }) {
  const controls = [
    { label: "Inverter tabuleiro", icon: Shuffle, action: onFlip, disabled: false },
    { label: "Oferecer empate", icon: Handshake, action: onDraw, disabled: finished },
    { label: "Abandonar", icon: Flag, action: onResign, disabled: finished },
    { label: "Reiniciar demonstração", icon: RotateCcw, action: onRestart, disabled: false },
    { label: "Voltar à preparação", icon: Undo2, action: onBack, disabled: false },
    { label: "Encerrar e apagar demonstração", icon: Trash2, action: onDelete, disabled: false },
  ];
  return <section aria-label="Controles da partida" className="grid grid-cols-2 gap-2 rounded-2xl border border-line bg-surface p-3 sm:flex sm:flex-wrap">{controls.map(({ label, icon: Icon, action, disabled }) => <button key={label} type="button" disabled={disabled} onClick={action} className={`${buttonBase} inline-flex min-h-11 items-center justify-center gap-2 border border-line bg-white hover:bg-neutral-100`}><Icon size={17} aria-hidden="true"/>{label}</button>)}</section>;
}
