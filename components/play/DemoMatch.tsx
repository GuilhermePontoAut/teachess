"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Chess, type Color, type Square } from "chess.js";
import { currentUser } from "@/lib/data/users";
import type { PlayerColor } from "@/lib/types/chess";
import type { DemoMatchConfig, DemoMove, MatchReason, MatchResult } from "@/lib/types/play";
import { MatchBoard } from "./MatchBoard";
import { MatchControls } from "./MatchControls";
import { MatchDialog } from "./MatchDialog";
import { MatchResultDialog } from "./MatchResultDialog";
import { MatchStatus } from "./MatchStatus";
import { MoveHistory } from "./MoveHistory";
import { PlayerClock } from "./PlayerClock";
import { SimulatedChat } from "./SimulatedChat";

type PendingDialog = "draw" | "resign" | "restart" | "back" | null;

function getBoardResult(game: Chess): MatchResult | null {
  if (game.isCheckmate()) return { winner: game.turn() === "w" ? "black" : "white", reason: "checkmate" };
  const draws: Array<[boolean, MatchReason]> = [[game.isStalemate(), "stalemate"], [game.isInsufficientMaterial(), "insufficient"], [game.isThreefoldRepetition(), "repetition"], [game.isDrawByFiftyMoves(), "fifty-move"]];
  const draw = draws.find(([matches]) => matches);
  return draw ? { winner: null, reason: draw[1] } : null;
}

function colorFromTurn(turn: Color): PlayerColor { return turn === "w" ? "white" : "black"; }

export function DemoMatch({ config, onBack }: { config: DemoMatchConfig; onBack: () => void }) {
  const initialMilliseconds = config.timeControl.minutes * 60_000;
  const [game, setGame] = useState(() => new Chess());
  const [moves, setMoves] = useState<DemoMove[]>([]);
  const [whiteMilliseconds, setWhiteMilliseconds] = useState(initialMilliseconds);
  const [blackMilliseconds, setBlackMilliseconds] = useState(initialMilliseconds);
  const [orientation, setOrientation] = useState<PlayerColor>(config.userColor);
  const [result, setResult] = useState<MatchResult | null>(null);
  const [dialog, setDialog] = useState<PendingDialog>(null);
  const [startedAt, setStartedAt] = useState(() => Date.now());
  const [durationSeconds, setDurationSeconds] = useState(0);
  const resultRef = useRef<MatchResult | null>(null);

  const finish = useCallback((nextResult: MatchResult) => {
    if (resultRef.current) return;
    resultRef.current = nextResult;
    setDurationSeconds(Math.max(0, Math.floor((Date.now() - startedAt) / 1000)));
    setResult(nextResult);
  }, [startedAt]);

  useEffect(() => {
    if (result) return;
    let lastTick = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const elapsed = now - lastTick;
      lastTick = now;
      const turn = game.turn();
      const update = (current: number) => {
        const next = Math.max(0, current - elapsed);
        if (next === 0) finish({ winner: turn === "w" ? "black" : "white", reason: "timeout" });
        return next;
      };
      if (turn === "w") setWhiteMilliseconds(update); else setBlackMilliseconds(update);
    }, 250);
    return () => window.clearInterval(interval);
  }, [finish, game, result]);

  const reset = useCallback(() => {
    resultRef.current = null;
    setGame(new Chess());
    setMoves([]);
    setWhiteMilliseconds(initialMilliseconds);
    setBlackMilliseconds(initialMilliseconds);
    setOrientation(config.userColor);
    setResult(null);
    setDialog(null);
    setStartedAt(Date.now());
    setDurationSeconds(0);
  }, [config.userColor, initialMilliseconds]);

  const onDrop = (source: string, target: string | null): boolean => {
    if (!target || result) return false;
    const next = new Chess(game.fen());
    try {
      const move = next.move({ from: source, to: target, promotion: "q" });
      const demoMove: DemoMove = { san: move.san, from: move.from, to: move.to, color: move.color };
      setGame(next);
      setMoves((current) => [...current, demoMove]);
      const increment = config.timeControl.increment * 1000;
      if (move.color === "w") setWhiteMilliseconds((current) => current + increment); else setBlackMilliseconds((current) => current + increment);
      const boardResult = getBoardResult(next);
      if (boardResult) finish(boardResult);
      return true;
    } catch { return false; }
  };

  const whitePlayer = config.userColor === "white" ? currentUser : config.opponent;
  const blackPlayer = config.userColor === "black" ? currentUser : config.opponent;
  const inCheck = game.isCheck();
  const kingSquare = useMemo(() => inCheck ? game.board().flat().find((piece) => piece?.type === "k" && piece.color === game.turn())?.square : undefined, [game, inCheck]);
  const activeColor = colorFromTurn(game.turn());
  const confirmDialog = () => {
    if (dialog === "draw") finish({ winner: null, reason: "draw-agreement" });
    if (dialog === "resign") finish({ winner: activeColor === "white" ? "black" : "white", reason: "resignation" });
    if (dialog === "restart") reset();
    if (dialog === "back") onBack();
    setDialog(null);
  };
  const dialogCopy = dialog === "draw" ? { title: "Oferecer empate", description: "Nenhum jogador real recebeu esta oferta. Ao aceitar, a demonstração termina empatada.", label: "Aceitar empate na demonstração", destructive: false } : dialog === "resign" ? { title: "Abandonar partida?", description: `A demonstração será encerrada e as ${activeColor === "white" ? "pretas" : "brancas"} vencerão por abandono.`, label: "Confirmar abandono", destructive: true } : dialog === "restart" ? { title: "Reiniciar demonstração?", description: "A posição, os lances e os relógios serão restaurados. Adversário, cor e controle de tempo serão mantidos.", label: "Reiniciar demonstração", destructive: false } : { title: "Voltar à preparação?", description: "A sessão local atual será descartada e nenhum resultado será registrado.", label: "Voltar à preparação", destructive: true };

  return <div className="space-y-5"><div role="note" className="rounded-2xl border border-line bg-neutral-950 p-4 text-sm leading-6 text-white"><strong>Neste protótipo, você movimenta as peças dos dois jogadores para testar o fluxo completo da partida.</strong> O TeaChess não escolhe lances e não há adversário conectado.</div>
    <MatchControls finished={Boolean(result)} onFlip={() => setOrientation((current) => current === "white" ? "black" : "white")} onDraw={() => setDialog("draw")} onResign={() => setDialog("resign")} onRestart={() => setDialog("restart")} onBack={() => result ? onBack() : setDialog("back")}/>
    <div className="grid min-w-0 gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(310px,.75fr)]"><section aria-label="Mesa da partida" className="min-w-0 space-y-3"><PlayerClock name={blackPlayer.name} rating={blackPlayer.currentPlatformRating} milliseconds={blackMilliseconds} active={!result && activeColor === "black"} color="black"/><MatchBoard fen={game.fen()} orientation={orientation} lastMove={moves.at(-1)} checkSquare={kingSquare as Square | undefined} disabled={Boolean(result)} onDrop={onDrop}/><PlayerClock name={whitePlayer.name} rating={whitePlayer.currentPlatformRating} milliseconds={whiteMilliseconds} active={!result && activeColor === "white"} color="white"/></section><aside className="min-w-0 space-y-5"><MatchStatus config={config} moves={moves} inCheck={inCheck} result={result}/><MoveHistory moves={moves}/><SimulatedChat/></aside></div>
    <MatchDialog open={Boolean(dialog)} title={dialogCopy.title} description={dialogCopy.description} confirmLabel={dialogCopy.label} destructive={dialogCopy.destructive} onCancel={() => setDialog(null)} onConfirm={confirmDialog}/>
    <MatchResultDialog result={result} moveCount={Math.ceil(moves.length / 2)} durationSeconds={durationSeconds} onNew={reset} onBack={onBack}/>
  </div>;
}
