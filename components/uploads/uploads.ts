import type { UploadSource, UploadType } from "@/lib/types/chess";
export const uploadTypeLabels: Record<UploadType,string>={physical_board:"Foto de tabuleiro físico",online_screenshot:"Print de partida online",study_position:"Posição de estudo",game_sequence:"Sequência de imagens de uma partida",other:"Outro"};
export const uploadSourceLabels: Record<UploadSource,string>={presencial:"Presencial","chess.com":"Chess.com",lichess:"Lichess",outro:"Outro"};
