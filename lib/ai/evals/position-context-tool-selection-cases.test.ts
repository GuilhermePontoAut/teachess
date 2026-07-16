import assert from "node:assert/strict";
import { test } from "node:test";
import {
  POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
  positionContextToolSelectionCases,
} from "./position-context-tool-selection-cases";

test("casos AUTO-SEL são versionados, únicos e permanecem não executados", () => {
  assert.equal(
    POSITION_CONTEXT_TOOL_SELECTION_EVAL_SET_VERSION,
    "position-context-tool-selection-evals-v1",
  );
  assert.equal(positionContextToolSelectionCases.length, 6);
  assert.deepEqual(
    positionContextToolSelectionCases.map((item) => item.id),
    [
      "AUTO-SEL-001",
      "AUTO-SEL-002",
      "AUTO-SEL-003",
      "AUTO-SEL-004",
      "AUTO-SEL-005",
      "AUTO-SEL-006",
    ],
  );
  assert.deepEqual(
    positionContextToolSelectionCases.map((item) => item.expectedDecision),
    ["called", "called", "called", "not_called", "not_called", "not_called"],
  );
  for (const item of positionContextToolSelectionCases) {
    assert.equal(item.status, "not_executed");
    assert.ok(item.message.length > 0);
    assert.ok(item.rationale.length > 0);
    assert.ok(item.prohibitedBehaviors.length > 0);
  }
});
