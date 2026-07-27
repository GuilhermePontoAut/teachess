import assert from "node:assert/strict";
import test from "node:test";
import { migrateFutureAiInteractions } from "./useFutureAiDemoStore";

const answer = {
  summary: "Resumo",
  observations: [],
  strengths: [],
  improvements: [],
  studyRecommendations: [],
  evidenceUsed: [],
  limitations: [],
  evidenceStatus: "partial",
};

test("histórico preserva o consentimento usado em cada resposta", () => {
  const migrated = migrateFutureAiInteractions({
    interactions: [
      {
        id: "interaction-1",
        question: "Pergunta",
        context: {
          type: "game-analysis",
          id: "game-1",
          label: "Partida",
        },
        answer,
        toolDecision: {
          status: "not_called",
          name: null,
          callCount: 0,
          executionStatus: "not_executed",
        },
        dataAccessPreference: { allowContextLookup: false },
        createdAt: "2026-07-27T12:00:00.000Z",
      },
    ],
  });

  assert.deepEqual(migrated.interactions[0].dataAccessPreference, {
    allowContextLookup: false,
  });
});

test("histórico antigo não inventa consentimento retroativo", () => {
  const migrated = migrateFutureAiInteractions({
    interactions: [
      {
        question: "Pergunta antiga",
        context: { type: "game-analysis", id: "game-1", label: "Partida" },
        answer,
        createdAt: "2026-07-27T11:00:00.000Z",
      },
    ],
  });
  assert.equal(migrated.interactions[0].dataAccessPreference, null);
});
