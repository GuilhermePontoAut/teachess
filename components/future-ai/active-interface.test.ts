import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const activeFiles = [
  "components/future-ai/AiProfessorDemo.tsx",
  "components/future-ai/ContextSelector.tsx",
  "components/future-ai/AnalysisActionPanel.tsx",
  "components/future-ai/FutureAiContent.tsx",
].map((path) => readFileSync(path, "utf8")).join("\n");

test("interface ativa não contém controles ou histórico de perguntas", () => {
  for (const removedText of [
    "Sua pergunta",
    "Perguntas sugeridas",
    "Perguntar ao Professor IA",
    "Nova conversa",
    'type="checkbox"',
    "ProfessorConversation",
    "NewConversationDialog",
  ]) {
    assert.equal(activeFiles.includes(removedText), false, removedText);
  }
});

test("interface usa Análise de posição e os novos botões", () => {
  assert.equal(activeFiles.includes("Análise de posição"), true);
  assert.equal(activeFiles.includes("Analisar partida"), true);
  assert.equal(activeFiles.includes("Analisar posição"), true);
  assert.equal(activeFiles.includes("isAnalysisActionDisabled(status, hasSelection)"), true);
});

test("interface ativa não chama OpenAI, rede ou Stockfish", () => {
  assert.equal(activeFiles.includes('fetch('), false);
  assert.equal(activeFiles.includes("/api/ai/professor"), false);
  assert.equal(activeFiles.includes("new Worker"), false);
  assert.equal(activeFiles.includes("stockfish.js"), false);
});
