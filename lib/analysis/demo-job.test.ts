import assert from "node:assert/strict";
import test from "node:test";
import {
  completeDemoAnalysis,
  createDemoAnalysisJob,
  STRUCTURAL_ANALYSIS_MESSAGE,
  transitionAnalysisJob,
} from "./demo-job";
import { isAnalysisActionDisabled } from "./ui-state";

const target = { type: "game", gameId: "game-1" } as const;

test("job demonstrativo percorre idle, preparing, analyzing e completed", () => {
  let job = createDemoAnalysisJob(target, "2026-07-28T10:00:00.000Z", "job-1");
  assert.equal(job.status, "idle");
  job = transitionAnalysisJob(job, "preparing", "2026-07-28T10:00:01.000Z");
  assert.equal(job.status, "preparing");
  job = transitionAnalysisJob(job, "analyzing", "2026-07-28T10:00:02.000Z");
  assert.equal(job.status, "analyzing");
  job = transitionAnalysisJob(job, "completed", "2026-07-28T10:00:03.000Z");
  assert.equal(job.status, "completed");
  assert.equal(completeDemoAnalysis(job).message, STRUCTURAL_ANALYSIS_MESSAGE);
});

test("job demonstrativo prevê falha sem inventar resultado", () => {
  let job = createDemoAnalysisJob(target, "2026-07-28T10:00:00.000Z", "job-2");
  job = transitionAnalysisJob(job, "preparing", "2026-07-28T10:00:01.000Z");
  job = transitionAnalysisJob(
    job,
    "failed",
    "2026-07-28T10:00:02.000Z",
    "Erro sanitizado",
  );
  assert.equal(job.status, "failed");
  assert.equal(job.error, "Erro sanitizado");
  assert.throws(() => completeDemoAnalysis(job));
});

test("transições inválidas são rejeitadas", () => {
  const job = createDemoAnalysisJob(target, "2026-07-28T10:00:00.000Z", "job-3");
  assert.throws(() =>
    transitionAnalysisJob(job, "completed", "2026-07-28T10:00:01.000Z"),
  );
});

test("ação fica desabilitada sem seleção e habilitada após seleção", () => {
  assert.equal(isAnalysisActionDisabled("idle", false), true);
  assert.equal(isAnalysisActionDisabled("idle", true), false);
  assert.equal(isAnalysisActionDisabled("preparing", true), true);
  assert.equal(isAnalysisActionDisabled("analyzing", true), true);
  assert.equal(isAnalysisActionDisabled("completed", true), false);
  assert.equal(isAnalysisActionDisabled("failed", true), false);
});
