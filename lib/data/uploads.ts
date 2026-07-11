import type { UploadedPosition } from "@/lib/types/chess";

export const mockUploads: UploadedPosition[] = [
  {
    id: "upload-01", ownerUserId: "user-current", visibility: "private", title: "Final de peões do treino",
    imageOrigin: "physical_board_photo", sourceContext: "personal_study", sourceDetails: "", date: "2026-06-12",
    description: "Posição para revisar a atividade do rei.", linkedGameId: null, fileName: "final-peoes.png",
    fileSize: 248320, mimeType: "image/png", tags: ["final", "peões"],
    simulatedDetectedFen: "8/5pk1/4p1p1/3pP3/3P1P2/6P1/5K2/8 w - - 0 38", simulatedSideToMove: "white",
    simulatedConfidence: 0.92, recognitionStatus: "demo_available", favorite: false, personalStudyNotes: "",
    migrationNote: null, createdAt: "2026-06-12T14:20:00.000Z", updatedAt: "2026-06-12T14:20:00.000Z",
  },
  {
    id: "upload-02", ownerUserId: "user-current", visibility: "private", title: "Posição crítica do clube",
    imageOrigin: "physical_board_photo", sourceContext: "club", sourceDetails: "", date: "2026-06-03",
    description: "Foto de uma posição difícil encontrada no clube.", linkedGameId: null, fileName: "posicao-clube.jpg",
    fileSize: 421000, mimeType: "image/jpeg", tags: ["clube", "estratégia"],
    simulatedDetectedFen: "r2q1rk1/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PPQN1PPP/R1B2RK1 w - - 4 10", simulatedSideToMove: "white",
    simulatedConfidence: 0.86, recognitionStatus: "demo_available", favorite: true, personalStudyNotes: "Revisar os planos no centro.",
    migrationNote: null, createdAt: "2026-06-03T19:10:00.000Z", updatedAt: "2026-06-03T19:10:00.000Z",
  },
];
