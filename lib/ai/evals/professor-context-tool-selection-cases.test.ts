import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
  professorContextToolSelectionEvalCaseSchema,
  professorContextToolSelectionEvalCasesSchema,
  professorContextToolSelectionCases,
} from "./professor-context-tool-selection-cases";

const canonicalIds = [
  "GAME-SEL-001",
  "GAME-SEL-002",
  "GAME-SEL-003",
  "GAME-SEL-004",
  "POSITION-SEL-001",
  "POSITION-SEL-002",
  "POSITION-SEL-003",
  "POSITION-SEL-004",
  "NO-TOOL-SEL-001",
  "NO-TOOL-SEL-002",
  "NO-TOOL-SEL-003",
  "NO-TOOL-SEL-004",
] as const;

const canonicalExpectedDecisions = [
  "get_game_context",
  "get_game_context",
  "get_game_context",
  "get_game_context",
  "get_position_context",
  "get_position_context",
  "get_position_context",
  "get_position_context",
  "not_called",
  "not_called",
  "not_called",
  "not_called",
] as const;

test("conjunto v1 contém exatamente os doze IDs canônicos na ordem fixa", () => {
  assert.equal(
    PROFESSOR_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
    "professor-context-tool-selection-evals-v1",
  );
  assert.equal(professorContextToolSelectionCases.length, 12);
  assert.deepEqual(
    professorContextToolSelectionCases.map((evalCase) => evalCase.id),
    canonicalIds,
  );
  assert.equal(
    new Set(professorContextToolSelectionCases.map((evalCase) => evalCase.id))
      .size,
    12,
  );
  assert.deepEqual(
    professorContextToolSelectionCases.map(
      (evalCase) => evalCase.expectedDecision,
    ),
    canonicalExpectedDecisions,
  );
});

test("classes e decisões são equilibradas em quatro casos cada", () => {
  for (const [field, expectedValues] of [
    [
      "category",
      ["game_required", "position_required", "no_tool_required"],
    ],
    [
      "expectedDecision",
      ["get_game_context", "get_position_context", "not_called"],
    ],
  ] as const) {
    for (const expected of expectedValues) {
      assert.equal(
        professorContextToolSelectionCases.filter(
          (evalCase) => evalCase[field] === expected,
        ).length,
        4,
      );
    }
  }
});

test("todos os casos são estritos, declarativos e não executados", () => {
  assert.equal(
    professorContextToolSelectionEvalCasesSchema.safeParse(
      professorContextToolSelectionCases,
    ).success,
    true,
  );
  for (const evalCase of professorContextToolSelectionCases) {
    assert.equal(evalCase.status, "not_executed");
    assert.ok(evalCase.message.trim().length > 0);
    assert.ok(evalCase.rationale.trim().length > 0);
    assert.ok(evalCase.prohibitedBehaviors.length > 0);
    assert.equal(Object.isFrozen(evalCase), true);
    assert.equal(Object.isFrozen(evalCase.prohibitedBehaviors), true);
    assert.equal("accuracy" in evalCase, false);
    assert.equal("actualDecision" in evalCase, false);
    assert.equal("result" in evalCase, false);
  }
});

test("schema de caso rejeita propriedades extras e campos vazios", () => {
  const base = professorContextToolSelectionCases[0];
  for (const value of [
    { ...base, extra: true },
    { ...base, message: " " },
    { ...base, rationale: " " },
    { ...base, prohibitedBehaviors: [] },
    { ...base, status: "executed" },
    { ...base, accuracy: 1 },
  ]) {
    assert.equal(
      professorContextToolSelectionEvalCaseSchema.safeParse(value).success,
      false,
    );
  }
});

test("mensagem ambígua é idêntica nos casos game e position correspondentes", () => {
  assert.equal(
    professorContextToolSelectionCases[2].message,
    professorContextToolSelectionCases[6].message,
  );
  assert.equal(
    professorContextToolSelectionCases[2].expectedDecision,
    "get_game_context",
  );
  assert.equal(
    professorContextToolSelectionCases[6].expectedDecision,
    "get_position_context",
  );
});
