import type { ImageOrigin, PositionSourceContext, RecognitionStatus } from "@/lib/types/chess";

export const imageOriginLabels: Record<ImageOrigin, string> = {
  physical_board_photo: "Foto de tabuleiro físico",
  online_game_screenshot: "Print de partida online",
};

export const physicalContextLabels = {
  in_person_game: "Partida presencial",
  tournament: "Torneio",
  club: "Clube",
  personal_study: "Estudo pessoal",
  other: "Outro",
} as const;

export const onlineContextLabels = {
  teachess: "TeaChess",
  "chess.com": "Chess.com",
  lichess: "Lichess",
  other: "Outro",
} as const;

export const sourceContextLabels: Record<PositionSourceContext, string> = {
  ...physicalContextLabels,
  ...onlineContextLabels,
};

export const recognitionStatusLabels: Record<RecognitionStatus, string> = {
  demo_available: "Demonstração disponível",
  preview_only: "Somente prévia",
  not_processed: "Não processada",
};

export const simulatedRecognitionDisclaimer = "O FEN e a posição apresentados nesta demonstração não foram extraídos da imagem. Eles são dados simulados usados apenas para representar a futura experiência de reconhecimento automático.";
