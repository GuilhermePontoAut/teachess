import assert from "node:assert/strict";
import test from "node:test";
import {
  defaultAllowContextLookup,
  professorResponseSourceLabel,
} from "./data-access";

const gameContext = {
  type: "game-analysis",
  id: "game-1",
  label: "Partida",
} as const;

test("contextos atuais começam autorizados e ausência começa bloqueada", () => {
  assert.equal(defaultAllowContextLookup(gameContext), true);
  assert.equal(
    defaultAllowContextLookup({
      type: "saved-position",
      id: "position-1",
      label: "Posição",
    }),
    true,
  );
  assert.equal(defaultAllowContextLookup(null), false);
});

test("nova conversa restaura o default coerente com o contexto selecionado", () => {
  assert.equal(defaultAllowContextLookup(gameContext), true);
  assert.equal(
    defaultAllowContextLookup({ ...gameContext, legacy: true }),
    false,
  );
});

test("indicador por resposta prioriza o consentimento preservado", () => {
  assert.equal(
    professorResponseSourceLabel(
      { allowContextLookup: false },
      {
        status: "not_called",
        name: null,
        callCount: 0,
        executionStatus: "not_executed",
      },
    ),
    "Consulta aos dados desativada nesta pergunta",
  );
  assert.equal(
    professorResponseSourceLabel(
      { allowContextLookup: true },
      {
        status: "not_called",
        name: null,
        callCount: 0,
        executionStatus: "not_executed",
      },
    ),
    "Resposta sem consulta aos dados selecionados",
  );
});
