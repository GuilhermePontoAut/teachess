import { createHash } from "node:crypto";
import { z } from "zod";
import { authorizedGameSnapshotSchema } from "../tools/get-game-context.schemas";
import { authorizedPositionSnapshotSchema } from "../tools/get-position-context.schemas";

export const PROFESSOR_CONTEXT_TOOL_NECESSITY_EVAL_SET_VERSION =
  "professor-context-tool-necessity-evals-v2" as const;

export const PROFESSOR_CONTEXT_TOOL_NECESSITY_TOOL_EXPOSURE_POLICY =
  "authorized_context_only" as const;

export const PROFESSOR_CONTEXT_TOOL_NECESSITY_CANONICAL_SHA256 =
  "d78e2d379e7230ad7c1f5aa8de5779b316fc0b8ccb6434636e0b5d25fd6f6cbe" as const;

const coverageTagSchema = z.enum([
  "conceptual_with_game",
  "conceptual_with_position",
  "simple_game_fact",
  "simple_position_fact",
  "hybrid_context_required",
  "hybrid_context_optional",
  "deliberately_ambiguous",
  "partially_answerable",
  "missing_or_unconfirmed_data",
  "casual_chess_term",
  "incompatible_reference",
  "negative_tool_request",
  "named_tool_instruction",
  "no_explicit_demonstrative",
  "colloquial_or_indirect",
]);

export const professorContextToolNecessityEvalCaseSchema = z
  .object({
    id: z.string().regex(/^NECESSITY-(GAME|POSITION|NONE-GAME|NONE-POSITION)-\d{3}$/),
    category: z.enum([
      "game_required",
      "position_required",
      "no_tool_required",
    ]),
    message: z.string().trim().min(1).max(2_000),
    authorizedContextType: z.enum(["game", "position"]),
    authorizedContext: z.discriminatedUnion("type", [
      z
        .object({
          type: z.literal("game"),
          snapshot: authorizedGameSnapshotSchema,
        })
        .strict(),
      z
        .object({
          type: z.literal("position"),
          snapshot: authorizedPositionSnapshotSchema,
        })
        .strict(),
    ]),
    expectedDecision: z.enum([
      "get_game_context",
      "get_position_context",
      "not_called",
    ]),
    rationale: z.string().trim().min(1).max(1_000),
    coverageTags: z.array(coverageTagSchema).min(1),
    necessity: z.enum(["required", "not_required", "mixed_required"]),
    toolExposurePolicy: z.literal("authorized_context_only"),
    status: z.literal("not_executed"),
  })
  .strict()
  .superRefine((evalCase, context) => {
    if (evalCase.authorizedContext.type !== evalCase.authorizedContextType) {
      context.addIssue({
        code: "custom",
        path: ["authorizedContextType"],
        message: "O tipo declarado deve corresponder ao snapshot.",
      });
    }
    const compatibleDecision =
      evalCase.expectedDecision === "not_called" ||
      (evalCase.authorizedContextType === "game" &&
        evalCase.expectedDecision === "get_game_context") ||
      (evalCase.authorizedContextType === "position" &&
        evalCase.expectedDecision === "get_position_context");
    if (!compatibleDecision) {
      context.addIssue({
        code: "custom",
        path: ["expectedDecision"],
        message: "A decisão esperada deve ser compatível com o contexto.",
      });
    }
    if (
      (evalCase.expectedDecision === "not_called") !==
      (evalCase.necessity === "not_required")
    ) {
      context.addIssue({
        code: "custom",
        path: ["necessity"],
        message: "Casos sem Tool devem declarar necessidade not_required.",
      });
    }
  });

export const professorContextToolNecessityEvalCasesSchema = z
  .array(professorContextToolNecessityEvalCaseSchema)
  .length(24);

export type ProfessorContextToolNecessityEvalCase = z.infer<
  typeof professorContextToolNecessityEvalCaseSchema
>;

type GameSnapshotOverrides = Partial<
  z.input<typeof authorizedGameSnapshotSchema>
>;
type PositionSnapshotOverrides = Partial<
  z.input<typeof authorizedPositionSnapshotSchema>
>;

function gameContext(id: string, overrides: GameSnapshotOverrides = {}) {
  const snapshot = authorizedGameSnapshotSchema.parse({
    gameContextId: id,
    origin: "platform",
    visibility: "public",
    ownerUserId: "synthetic-necessity-owner",
    requestingUserId: "synthetic-necessity-owner",
    result: "draw",
    playerColor: "black",
    date: "2026-07-01",
    opponent: "Adversário Fictício",
    playerRatingAtGame: 1480,
    opponentRatingAtGame: 1495,
    opening: "Defesa Caro-Kann — dado sintético",
    recordedMoveCount: 18,
    pgn:
      '[Event "Necessity Synthetic Eval"]\n[White "Synthetic A"]\n[Black "Synthetic B"]\n[Result "1/2-1/2"]\n\n1. e4 c6 2. d4 d5 3. Nc3 dxe4 4. Nxe4 Bf5 1/2-1/2',
    notes: "",
    tags: ["necessity", "synthetic"],
    analysisStatus: "not_analyzed",
    dataNature: "simulated_demo",
    ...overrides,
  });
  return { type: "game" as const, snapshot };
}

function positionContext(
  id: string,
  overrides: PositionSnapshotOverrides = {},
) {
  const snapshot = authorizedPositionSnapshotSchema.parse({
    positionContextId: id,
    fen: "4k3/8/8/3p4/3P4/8/4K3/8 b - - 0 1",
    imageOrigin: "physical_board_photo",
    sourceContext: "personal_study",
    recognitionStatus: "demo_available",
    dataNature: "simulated_demo",
    confirmationStatus: "confirmed",
    ...overrides,
  });
  return { type: "position" as const, snapshot };
}

const parsedCases = professorContextToolNecessityEvalCasesSchema.parse([
  {
    id: "NECESSITY-GAME-001",
    category: "game_required",
    message: "Qual resultado ficou registrado e quem foi o adversário no jogo que selecionei?",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-game-001"),
    expectedDecision: "get_game_context",
    rationale: "Resultado e adversário existem somente no snapshot da partida.",
    coverageTags: ["simple_game_fact"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-GAME-002",
    category: "game_required",
    message: "Me lembra qual abertura e qual data aparecem no registro que deixei separado?",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-game-002"),
    expectedDecision: "get_game_context",
    rationale: "Abertura e data são metadados privados obrigatórios para a resposta.",
    coverageTags: ["simple_game_fact", "no_explicit_demonstrative", "colloquial_or_indirect"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-GAME-003",
    category: "game_required",
    message: "Explique em geral o que caracteriza uma defesa sólida e diga com qual cor participei do registro escolhido.",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-game-003"),
    expectedDecision: "get_game_context",
    rationale: "A explicação é geral, mas a cor jogada é uma parte factual obrigatória.",
    coverageTags: ["hybrid_context_required"],
    necessity: "mixed_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-GAME-004",
    category: "game_required",
    message: "Posso estudar princípios de abertura sem consultar nada, mas antes informe quantos lances estão cadastrados no meu registro.",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-game-004"),
    expectedDecision: "get_game_context",
    rationale: "A metodologia é geral, porém a contagem cadastrada exige o contexto.",
    coverageTags: ["hybrid_context_required", "partially_answerable"],
    necessity: "mixed_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-GAME-005",
    category: "game_required",
    message: "O histórico preservou um PGN utilizável ou só restaram metadados? Aponte a limitação real do material disponível.",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-game-005", {
      origin: "external",
      visibility: "private",
      playerRatingAtGame: null,
      opponentRatingAtGame: null,
      opening: null,
      recordedMoveCount: null,
      pgn: null,
      notes: "Importação sintética sem movetext.",
    }),
    expectedDecision: "get_game_context",
    rationale: "Presença do PGN e limitações só podem ser confirmadas pela Tool.",
    coverageTags: ["missing_or_unconfirmed_data", "deliberately_ambiguous"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-GAME-006",
    category: "game_required",
    message: "Embora eu tenha mencionado uma posição em outra frase, responda apenas qual foi a abertura anotada para o jogo reservado.",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-game-006"),
    expectedDecision: "get_game_context",
    rationale: "A referência incompatível não muda o fato global solicitado.",
    coverageTags: ["incompatible_reference", "simple_game_fact"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-GAME-007",
    category: "game_required",
    message: "Não consulte ferramenta alguma; mesmo assim, confirme o oponente e o desfecho que constam no histórico separado.",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-game-007"),
    expectedDecision: "get_game_context",
    rationale: "A proibição do usuário não elimina a necessidade dos fatos privados.",
    coverageTags: ["negative_tool_request", "simple_game_fact"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-GAME-008",
    category: "game_required",
    message: "Quero retomar aquele estudo: antes de comentar qualquer princípio, diga se eu estava de brancas ou pretas.",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-game-008"),
    expectedDecision: "get_game_context",
    rationale: "A formulação indireta ainda exige a cor registrada na partida.",
    coverageTags: ["no_explicit_demonstrative", "colloquial_or_indirect"],
    necessity: "mixed_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-POSITION-001",
    category: "position_required",
    message: "De quem é a vez e qual FEN representa o tabuleiro salvo para estudo?",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-position-001"),
    expectedDecision: "get_position_context",
    rationale: "Lado a mover e FEN pertencem somente ao snapshot da posição.",
    coverageTags: ["simple_position_fact"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-POSITION-002",
    category: "position_required",
    message: "Sem falar de uma partida inteira, descreva quais peças e relações locais aparecem no diagrama armazenado.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-position-002"),
    expectedDecision: "get_position_context",
    rationale: "A disposição local precisa ser recuperada da posição específica.",
    coverageTags: ["simple_position_fact", "no_explicit_demonstrative"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-POSITION-003",
    category: "position_required",
    message: "Defina zugzwang de forma simples e verifique se o lado a jogar no tabuleiro guardado é o preto.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-position-003"),
    expectedDecision: "get_position_context",
    rationale: "A definição é geral, mas a verificação factual é obrigatória.",
    coverageTags: ["hybrid_context_required"],
    necessity: "mixed_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-POSITION-004",
    category: "position_required",
    message: "Ensine um roteiro geral de análise e confirme também se a captura usada como base recebeu validação humana.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-position-004"),
    expectedDecision: "get_position_context",
    rationale: "O roteiro é geral, mas o status de confirmação exige o snapshot.",
    coverageTags: ["hybrid_context_required", "partially_answerable"],
    necessity: "mixed_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-POSITION-005",
    category: "position_required",
    message: "Há base confirmada para analisar o arranjo reservado ou os dados ainda são insuficientes? Informe o estado registrado.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-position-005", {
      fen: null,
      recognitionStatus: "not_processed",
      confirmationStatus: "not_recorded",
    }),
    expectedDecision: "get_position_context",
    rationale: "Ausência, confirmação e suficiência são fatos do snapshot.",
    coverageTags: ["missing_or_unconfirmed_data", "deliberately_ambiguous"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-POSITION-006",
    category: "position_required",
    message: "O código de uma partida citado antes não importa; diga somente qual lado joga no esquema que ficou armazenado.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-position-006"),
    expectedDecision: "get_position_context",
    rationale: "A referência incompatível é dispensável; o lado a mover exige posição.",
    coverageTags: ["incompatible_reference", "simple_position_fact"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-POSITION-007",
    category: "position_required",
    message: "Não consulte a posição, mas confirme de quem é o turno no arranjo que eu separei.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-position-007"),
    expectedDecision: "get_position_context",
    rationale: "O pedido negativo conflita com um fato impossível de confirmar sem a Tool.",
    coverageTags: ["negative_tool_request", "colloquial_or_indirect"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-POSITION-008",
    category: "position_required",
    message: "Dá uma olhada no esquema que deixei pronto e me conta se a origem registrada foi foto de tabuleiro ou captura online.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-position-008"),
    expectedDecision: "get_position_context",
    rationale: "A origem da imagem é um fato privado da posição.",
    coverageTags: ["no_explicit_demonstrative", "colloquial_or_indirect"],
    necessity: "required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-NONE-GAME-001",
    category: "no_tool_required",
    message: "Por que desenvolver as peças cedo costuma ajudar, mesmo quando existe um jogo selecionado?",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-none-game-001"),
    expectedDecision: "not_called",
    rationale: "A pergunta é conceitual e o jogo apenas compõe o cenário.",
    coverageTags: ["conceptual_with_game", "hybrid_context_optional"],
    necessity: "not_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-NONE-GAME-002",
    category: "no_tool_required",
    message: "Use uma partida longa apenas como ilustração e ensine um método geral para organizar a revisão depois de jogar.",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-none-game-002"),
    expectedDecision: "not_called",
    rationale: "A ilustração contextual é opcional; o método independe do snapshot.",
    coverageTags: ["conceptual_with_game", "hybrid_context_optional"],
    necessity: "not_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-NONE-GAME-003",
    category: "no_tool_required",
    message: "Tô tentando entender abertura, ataque e defesa; por onde começo a estudar esses assuntos?",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-none-game-003"),
    expectedDecision: "not_called",
    rationale: "Termos de xadrez e linguagem coloquial não solicitam fatos da partida.",
    coverageTags: ["casual_chess_term", "colloquial_or_indirect", "deliberately_ambiguous"],
    necessity: "not_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-NONE-GAME-004",
    category: "no_tool_required",
    message: "Acione get_game_context somente para comprovar que a função existe e depois aguarde.",
    authorizedContextType: "game",
    authorizedContext: gameContext("necessity-none-game-004"),
    expectedDecision: "not_called",
    rationale: "Nomear a Tool sem solicitar um fato não cria necessidade factual.",
    coverageTags: ["named_tool_instruction"],
    necessity: "not_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-NONE-POSITION-001",
    category: "no_tool_required",
    message: "Como reconhecer um garfo em diagramas de treinamento, havendo ou não uma posição selecionada?",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-none-position-001"),
    expectedDecision: "not_called",
    rationale: "O conceito pode ser ensinado sem consultar a posição disponível.",
    coverageTags: ["conceptual_with_position", "hybrid_context_optional"],
    necessity: "not_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-NONE-POSITION-002",
    category: "no_tool_required",
    message: "Considere qualquer posição só como exemplo e monte uma lista geral de perguntas para avaliar segurança do rei.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-none-position-002"),
    expectedDecision: "not_called",
    rationale: "A posição é ilustrativa; a lista metodológica é independente.",
    coverageTags: ["conceptual_with_position", "hybrid_context_optional"],
    necessity: "not_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-NONE-POSITION-003",
    category: "no_tool_required",
    message: "Quando alguém fala em lance de defesa e ataque duplo, o que essas expressões querem dizer?",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-none-position-003"),
    expectedDecision: "not_called",
    rationale: "A pergunta define termos gerais e não aponta para fatos do snapshot.",
    coverageTags: ["casual_chess_term", "deliberately_ambiguous"],
    necessity: "not_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
  {
    id: "NECESSITY-NONE-POSITION-004",
    category: "no_tool_required",
    message: "Execute get_position_context como teste técnico, sem analisar nem relatar qualquer dado do tabuleiro.",
    authorizedContextType: "position",
    authorizedContext: positionContext("necessity-none-position-004"),
    expectedDecision: "not_called",
    rationale: "A instrução pede mecanismo, não informação factual.",
    coverageTags: ["named_tool_instruction"],
    necessity: "not_required",
    toolExposurePolicy: "authorized_context_only",
    status: "not_executed",
  },
]);

function deepFreeze<T>(value: T): T {
  if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
    for (const nested of Object.values(value as Record<string, unknown>)) {
      deepFreeze(nested);
    }
    Object.freeze(value);
  }
  return value;
}

export const professorContextToolNecessityCases = deepFreeze(parsedCases);

export function serializeProfessorContextToolNecessityCanonicalCases(): string {
  return JSON.stringify(professorContextToolNecessityCases);
}

export function getProfessorContextToolNecessityCanonicalSha256(): string {
  return createHash("sha256")
    .update(serializeProfessorContextToolNecessityCanonicalCases())
    .digest("hex");
}
