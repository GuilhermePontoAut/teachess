import assert from "node:assert/strict";
import test from "node:test";
import { migrateFutureAiAnalysisState } from "./useFutureAiDemoStore";

test("migração descarta o histórico de conversa legado", () => {
  const migrated = migrateFutureAiAnalysisState({
    interactions: [{ question: "Pergunta antiga", answer: { summary: "Resposta" } }],
  });

  assert.equal("interactions" in migrated, false);
  assert.equal(migrated.currentJob, null);
  assert.equal(migrated.lastResult, null);
});

test("migração converte a seleção antiga sem restaurar mensagens", () => {
  const migrated = migrateFutureAiAnalysisState({
    context: { type: "saved-position", id: "position-1" },
    interactions: [{ question: "Pergunta antiga" }],
  });

  assert.equal(migrated.analysisType, "position");
  assert.equal(migrated.selectedPositionId, "position-1");
});

test("migração não restaura jobs transitórios", () => {
  const migrated = migrateFutureAiAnalysisState({
    analysisType: "game",
    selectedGameId: "game-1",
    currentJob: {
      id: "job-1",
      target: { type: "game", gameId: "game-1" },
      status: "analyzing",
      createdAt: "2026-07-28T10:00:00.000Z",
      updatedAt: "2026-07-28T10:00:01.000Z",
      error: null,
    },
  });

  assert.equal(migrated.currentJob, null);
  assert.equal(migrated.selectedGameId, "game-1");
});

test("migração preserva somente erro sanitizado", () => {
  const migrated = migrateFutureAiAnalysisState({
    error: "Falha em https://provider.example/private",
  });

  assert.equal(migrated.error, "Falha em [endereço removido]");
});
