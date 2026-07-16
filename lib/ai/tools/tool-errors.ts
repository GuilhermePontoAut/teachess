export type PositionContextToolErrorCode =
  | "TOOL_ARGUMENTS_INVALID"
  | "SNAPSHOT_MISSING"
  | "SNAPSHOT_INVALID"
  | "POSITION_CONTEXT_NOT_AUTHORIZED"
  | "INTERNAL_TOOL_ERROR";

export type PublicPositionContextToolError = {
  code: PositionContextToolErrorCode;
  message: string;
};

const publicMessages: Record<PositionContextToolErrorCode, string> = {
  TOOL_ARGUMENTS_INVALID: "Os argumentos de get_position_context são inválidos.",
  SNAPSHOT_MISSING: "O snapshot autorizado da posição não foi fornecido.",
  SNAPSHOT_INVALID: "O snapshot autorizado da posição é inválido.",
  POSITION_CONTEXT_NOT_AUTHORIZED:
    "O contexto de posição solicitado não está autorizado.",
  INTERNAL_TOOL_ERROR: "Não foi possível obter o contexto da posição.",
};

export class PositionContextToolError extends Error {
  readonly code: PositionContextToolErrorCode;

  constructor(code: PositionContextToolErrorCode) {
    super(publicMessages[code]);
    this.name = "PositionContextToolError";
    this.code = code;
  }

  toJSON(): PublicPositionContextToolError {
    return {
      code: this.code,
      message: this.message,
    };
  }
}
