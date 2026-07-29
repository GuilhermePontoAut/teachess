import assert from "node:assert/strict";
import test from "node:test";
import { createPositionAnalysis, parseUciInfo } from "./stockfish-protocol";

test("normaliza centipawns para a perspectiva das brancas", () => {
  assert.equal(
    parseUciInfo("info depth 16 score cp 42 nodes 10 pv e2e4 e7e5", "white")?.evaluation,
    0.42,
  );
  assert.equal(
    parseUciInfo("info depth 16 score cp 42 nodes 10 pv e7e5 e2e4", "black")?.evaluation,
    -0.42,
  );
});

test("normaliza mate e preserva a variante em notação UCI", () => {
  const info = parseUciInfo("info depth 12 score mate -3 pv h7h8q e8e7", "black");
  assert.deepEqual(info, {
    depth: 12,
    evaluation: null,
    mateIn: 3,
    moves: ["h7h8q", "e8e7"],
  });
});

test("monta resultado de posição com configuração single-threaded", () => {
  const fen = "8/8/8/8/8/8/4K3/6k1 w - - 0 42";
  const result = createPositionAnalysis(fen, "e2f3", {
    depth: 16,
    evaluation: 0,
    mateIn: null,
    moves: ["e2f3"],
  });
  assert.equal(result.moveNumber, 42);
  assert.equal(result.engineSettings.threads, 1);
  assert.equal(result.principalVariations[0].moves[0], "e2f3");
});
