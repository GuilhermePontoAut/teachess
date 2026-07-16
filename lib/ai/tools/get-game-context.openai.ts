import type { FunctionTool } from "openai/resources/responses/responses";
import {
  GAME_CONTEXT_ID_MAX_LENGTH,
  GAME_CONTEXT_ID_PATTERN,
} from "./get-game-context.schemas";

export const GET_GAME_CONTEXT_TOOL_NAME = "get_game_context" as const;

export const GET_GAME_CONTEXT_TOOL_DESCRIPTION =
  "Retorna somente fatos estruturados sobre uma única partida já selecionada e autorizada pela aplicação. Não pesquisa outras partidas, não enumera histórico, não acessa stores ou localStorage, não calcula estatísticas globais, não usa engine, não indica melhor lance e não analisa autonomamente a partida. Recebe somente gameContextId, nunca PGN diretamente. O ID apenas correlaciona a chamada com o snapshot server-side: não concede autorização, e somente o snapshot autorizado fornece os dados reais.";

export const getGameContextOpenAITool = {
  type: "function",
  name: GET_GAME_CONTEXT_TOOL_NAME,
  description: GET_GAME_CONTEXT_TOOL_DESCRIPTION,
  strict: true,
  parameters: {
    type: "object",
    properties: {
      gameContextId: {
        type: "string",
        minLength: 1,
        maxLength: GAME_CONTEXT_ID_MAX_LENGTH,
        pattern: GAME_CONTEXT_ID_PATTERN.source,
        description:
          "Identificador opaco da única partida correlacionada ao snapshot server-side autorizado para esta requisição; não concede autorização.",
      },
    },
    required: ["gameContextId"],
    additionalProperties: false,
  },
} as const satisfies FunctionTool;

export const gameContextOpenAITools = [getGameContextOpenAITool] as const;
