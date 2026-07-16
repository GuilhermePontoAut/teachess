import type { FunctionTool } from "openai/resources/responses/responses";
import {
  POSITION_CONTEXT_ID_MAX_LENGTH,
  POSITION_CONTEXT_ID_PATTERN,
} from "./get-position-context.schemas";

export const GET_POSITION_CONTEXT_TOOL_NAME = "get_position_context" as const;

export const GET_POSITION_CONTEXT_TOOL_DESCRIPTION =
  "Retorna somente fatos estruturados sobre a posição já selecionada e autorizada pela aplicação. Use quando a pergunta depender do contexto dessa posição. Não pesquisa outras posições, não avalia a posição, não indica melhor lance, não executa engine e não recebe FEN. positionContextId serve apenas para correlacionar a solicitação ao snapshot autorizado e não concede autorização.";

export const getPositionContextOpenAITool = {
  type: "function",
  name: GET_POSITION_CONTEXT_TOOL_NAME,
  description: GET_POSITION_CONTEXT_TOOL_DESCRIPTION,
  strict: true,
  parameters: {
    type: "object",
    properties: {
      positionContextId: {
        type: "string",
        minLength: 1,
        maxLength: POSITION_CONTEXT_ID_MAX_LENGTH,
        pattern: POSITION_CONTEXT_ID_PATTERN.source,
        description:
          "Identificador opaco da única posição selecionada e autorizada para esta requisição; não concede autorização.",
      },
    },
    required: ["positionContextId"],
    additionalProperties: false,
  },
} as const satisfies FunctionTool;

export const positionContextOpenAITools = [getPositionContextOpenAITool] as const;
