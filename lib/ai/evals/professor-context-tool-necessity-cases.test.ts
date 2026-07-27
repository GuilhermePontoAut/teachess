import assert from "node:assert/strict";
import { test } from "node:test";
import {
  PROFESSOR_IA_SYSTEM_PROMPT_V2,
} from "../prompts/professor-ia-system-prompt-v2";
import {
  PROFESSOR_IA_SYSTEM_PROMPT_V3,
} from "../prompts/professor-ia-system-prompt-v3";
import {
  PROFESSOR_IA_SYSTEM_PROMPT_V4,
} from "../prompts/professor-ia-system-prompt-v4";
import { authorizedProfessorContextSchema } from "../tools/professor-context-tool-flow.schemas";
import { getOfferedProfessorContextToolNames } from "../tools/professor-context-tool-policy";
import { professorContextToolSelectionCases } from "./professor-context-tool-selection-cases";
import {
  PROFESSOR_CONTEXT_TOOL_NECESSITY_CANONICAL_SHA256,
  PROFESSOR_CONTEXT_TOOL_NECESSITY_EVAL_SET_VERSION,
  getProfessorContextToolNecessityCanonicalSha256,
  professorContextToolNecessityCases,
  professorContextToolNecessityEvalCasesSchema,
} from "./professor-context-tool-necessity-cases";

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/[^\p{Letter}\p{Number}]+/gu, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function wordBigrams(value: string): Set<string> {
  const words = normalizeText(value).split(" ").filter(Boolean);
  return new Set(words.slice(0, -1).map((word, index) => `${word} ${words[index + 1]}`));
}

function diceSimilarity(left: string, right: string): number {
  const a = wordBigrams(left);
  const b = wordBigrams(right);
  if (a.size === 0 || b.size === 0) return normalizeText(left) === normalizeText(right) ? 1 : 0;
  let intersection = 0;
  for (const item of a) if (b.has(item)) intersection += 1;
  return (2 * intersection) / (a.size + b.size);
}

function quotedPromptExamples(prompt: string): string[] {
  return [...prompt.matchAll(/[“"]([^”"\n]{12,})[”"]/g)].map((match) => match[1]);
}

test("v2 possui 24 casos congelados e balanceados em 8/8/8", () => {
  assert.equal(
    PROFESSOR_CONTEXT_TOOL_NECESSITY_EVAL_SET_VERSION,
    "professor-context-tool-necessity-evals-v2",
  );
  assert.equal(professorContextToolNecessityCases.length, 24);
  assert.equal(
    professorContextToolNecessityEvalCasesSchema.safeParse(
      professorContextToolNecessityCases,
    ).success,
    true,
  );
  for (const decision of [
    "get_game_context",
    "get_position_context",
    "not_called",
  ] as const) {
    assert.equal(
      professorContextToolNecessityCases.filter(
        (evalCase) => evalCase.expectedDecision === decision,
      ).length,
      8,
    );
  }
  const noToolCases = professorContextToolNecessityCases.filter(
    (evalCase) => evalCase.expectedDecision === "not_called",
  );
  assert.equal(
    noToolCases.filter((evalCase) => evalCase.authorizedContextType === "game")
      .length,
    4,
  );
  assert.equal(
    noToolCases.filter(
      (evalCase) => evalCase.authorizedContextType === "position",
    ).length,
    4,
  );
});

test("IDs, perguntas, snapshots e decisões são internamente coerentes", () => {
  assert.equal(
    new Set(professorContextToolNecessityCases.map((evalCase) => evalCase.id))
      .size,
    24,
  );
  for (const evalCase of professorContextToolNecessityCases) {
    assert.ok(evalCase.message.trim().length > 0);
    assert.equal(
      authorizedProfessorContextSchema.safeParse(evalCase.authorizedContext)
        .success,
      true,
    );
    assert.equal(evalCase.authorizedContext.type, evalCase.authorizedContextType);
    const expectedDecision =
      evalCase.authorizedContextType === "game"
        ? "get_game_context"
        : "get_position_context";
    if (evalCase.expectedDecision !== "not_called") {
      assert.equal(evalCase.expectedDecision, expectedDecision);
    }
    const snapshotId =
      evalCase.authorizedContext.type === "game"
        ? evalCase.authorizedContext.snapshot.gameContextId
        : evalCase.authorizedContext.snapshot.positionContextId;
    assert.equal(
      snapshotId,
      evalCase.id.toLocaleLowerCase("en-US").replace("necessity-", "necessity-"),
    );
    assert.equal(evalCase.toolExposurePolicy, "authorized_context_only");
    assert.equal(
      Object.isFrozen(evalCase.authorizedContext.snapshot),
      true,
    );
  }
});

test("authorized_context_only nunca oferece Tool incompatível", () => {
  for (const evalCase of professorContextToolNecessityCases) {
    assert.deepEqual(
      getOfferedProfessorContextToolNames(
        evalCase.authorizedContextType,
        "authorized_context_only",
      ),
      evalCase.authorizedContextType === "game"
        ? ["get_game_context"]
        : ["get_position_context"],
    );
  }
});

test("necessity está presente e coerente com a decisão", () => {
  const allowed = new Set(["required", "not_required", "mixed_required"]);
  for (const evalCase of professorContextToolNecessityCases) {
    assert.equal(allowed.has(evalCase.necessity), true);
    assert.equal(
      evalCase.expectedDecision === "not_called",
      evalCase.necessity === "not_required",
    );
    assert.ok(evalCase.rationale.trim().length > 0);
    assert.ok(evalCase.coverageTags.length > 0);
  }
});

test("perguntas são independentes do v1 e dos exemplos dos prompts", () => {
  const historical = professorContextToolSelectionCases.map((evalCase) => evalCase.message);
  const promptExamples = [
    ...quotedPromptExamples(PROFESSOR_IA_SYSTEM_PROMPT_V2),
    ...quotedPromptExamples(PROFESSOR_IA_SYSTEM_PROMPT_V3),
    ...quotedPromptExamples(PROFESSOR_IA_SYSTEM_PROMPT_V4),
  ];
  const references = [...historical, ...promptExamples];
  const normalizedReferences = new Set(references.map(normalizeText));
  for (const evalCase of professorContextToolNecessityCases) {
    assert.equal(references.includes(evalCase.message), false, evalCase.id);
    assert.equal(
      normalizedReferences.has(normalizeText(evalCase.message)),
      false,
      evalCase.id,
    );
    for (const reference of references) {
      assert.ok(
        diceSimilarity(evalCase.message, reference) < 0.82,
        `${evalCase.id} está superficialmente próximo de uma referência`,
      );
    }
  }
});

test("perguntas e IDs novos não se repetem entre si", () => {
  const normalized = professorContextToolNecessityCases.map((evalCase) =>
    normalizeText(evalCase.message),
  );
  assert.equal(new Set(normalized).size, 24);
  for (let left = 0; left < professorContextToolNecessityCases.length; left += 1) {
    for (let right = left + 1; right < professorContextToolNecessityCases.length; right += 1) {
      assert.ok(
        diceSimilarity(
          professorContextToolNecessityCases[left].message,
          professorContextToolNecessityCases[right].message,
        ) < 0.82,
      );
    }
  }
});

test("hash canônico detecta qualquer alteração futura", () => {
  assert.match(PROFESSOR_CONTEXT_TOOL_NECESSITY_CANONICAL_SHA256, /^[a-f0-9]{64}$/);
  assert.equal(
    getProfessorContextToolNecessityCanonicalSha256(),
    PROFESSOR_CONTEXT_TOOL_NECESSITY_CANONICAL_SHA256,
  );
});
