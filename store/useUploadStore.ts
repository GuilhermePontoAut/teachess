import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockUploads } from "@/lib/data/uploads";
import { currentUser } from "@/lib/data/users";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { ImageOrigin, PlayerColor, PositionSourceContext, RecognitionStatus, UploadedPosition, UploadMimeType } from "@/lib/types/chess";

interface UploadStore {
  uploads: UploadedPosition[];
  addUpload: (upload: UploadedPosition) => void;
  deleteUpload: (id: string) => boolean;
  updateStudy: (id: string, changes: { favorite?: boolean; personalStudyNotes?: string }) => boolean;
  resetUploads: () => void;
}

const previewUrls = new Map<string, string>();
export const getUploadPreviewUrl = (id: string): string | null => previewUrls.get(id) ?? null;
export function setUploadPreviewUrl(id: string, url: string): void {
  const previous = previewUrls.get(id);
  if (previous && previous !== url) URL.revokeObjectURL(previous);
  previewUrls.set(id, url);
}
export function revokeUploadPreviewUrl(id: string): void {
  const url = previewUrls.get(id);
  if (url) URL.revokeObjectURL(url);
  previewUrls.delete(id);
}

const demoFens = [
  "8/5pk1/4p1p1/3pP3/3P1P2/6P1/5K2/8 w - - 0 38",
  "r2q1rk1/pp2bppp/2n1pn2/2pp4/3P4/2PBPN2/PPQN1PPP/R1B2RK1 w - - 4 10",
];
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const stringValue = (value: unknown, fallback = ""): string => typeof value === "string" ? value : fallback;
const mimeValue = (value: unknown): UploadMimeType => value === "image/png" || value === "image/webp" ? value : "image/jpeg";
const originValue = (legacy: Record<string, unknown>): ImageOrigin => legacy.imageOrigin === "online_game_screenshot" || legacy.uploadType === "online_screenshot" || legacy.source === "chess.com" || legacy.source === "lichess" ? "online_game_screenshot" : "physical_board_photo";
const contextValue = (legacy: Record<string, unknown>, origin: ImageOrigin): PositionSourceContext => {
  const current = legacy.sourceContext;
  if (["in_person_game", "tournament", "club", "personal_study", "teachess", "chess.com", "lichess", "other"].includes(String(current))) return current as PositionSourceContext;
  if (origin === "online_game_screenshot") return legacy.source === "lichess" ? "lichess" : legacy.source === "chess.com" ? "chess.com" : "other";
  return legacy.source === "presencial" ? "in_person_game" : "other";
};

export function migratePersistedUploadState(state: unknown): { uploads: UploadedPosition[] } {
  if (!isRecord(state) || !Array.isArray(state.uploads)) return { uploads: mockUploads };
  return { uploads: state.uploads.filter(isRecord).map((legacy, index) => {
    const createdAt = stringValue(legacy.createdAt, new Date().toISOString());
    const oldFiles = Array.isArray(legacy.files) ? legacy.files.filter(isRecord) : [];
    const firstFile = oldFiles[0];
    const fileName = stringValue(legacy.fileName, firstFile ? stringValue(firstFile.name, `imagem-${index + 1}.jpg`) : `imagem-${index + 1}.jpg`);
    const fileSize = typeof legacy.fileSize === "number" ? legacy.fileSize : firstFile && typeof firstFile.sizeInBytes === "number" ? firstFile.sizeInBytes : typeof legacy.sizeInBytes === "number" ? legacy.sizeInBytes : 0;
    const mimeType = mimeValue(legacy.mimeType ?? firstFile?.mimeType);
    const imageOrigin = originValue(legacy);
    const sourceContext = contextValue(legacy, imageOrigin);
    const simulatedDetectedFen = typeof legacy.simulatedDetectedFen === "string" ? legacy.simulatedDetectedFen : demoFens[index % demoFens.length];
    const simulatedSideToMove: PlayerColor = legacy.simulatedSideToMove === "black" ? "black" : "white";
    const recognitionStatus: RecognitionStatus = legacy.recognitionStatus === "preview_only" || legacy.recognitionStatus === "not_processed" ? legacy.recognitionStatus : "demo_available";
    const multipleFiles = oldFiles.length > 1 || (typeof legacy.imageCount === "number" && legacy.imageCount > 1);
    return {
      id: stringValue(legacy.id, crypto.randomUUID()), ownerUserId: stringValue(legacy.ownerUserId, currentUser.id), visibility: "private",
      title: stringValue(legacy.title, fileName || "Posição migrada"), imageOrigin, sourceContext,
      sourceDetails: stringValue(legacy.sourceDetails, sourceContext === "other" ? "Contexto migrado" : ""), date: stringValue(legacy.date, createdAt.slice(0, 10)),
      description: stringValue(legacy.description, stringValue(legacy.notes)), linkedGameId: typeof legacy.linkedGameId === "string" ? legacy.linkedGameId : null,
      fileName, fileSize, mimeType, tags: Array.isArray(legacy.tags) ? legacy.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 10) : [],
      simulatedDetectedFen, simulatedSideToMove, simulatedConfidence: typeof legacy.simulatedConfidence === "number" ? legacy.simulatedConfidence : 0.84,
      recognitionStatus, favorite: legacy.favorite === true, personalStudyNotes: stringValue(legacy.personalStudyNotes),
      migrationNote: multipleFiles ? "Registro migrado de um envio com múltiplas imagens; somente os metadados do primeiro arquivo foram preservados." : typeof legacy.migrationNote === "string" ? legacy.migrationNote : null,
      createdAt, updatedAt: stringValue(legacy.updatedAt, createdAt),
    };
  }) };
}

export const useUploadStore = create<UploadStore>()(persist((set, get) => ({
  uploads: mockUploads,
  addUpload: (upload) => set((state) => ({ uploads: [upload, ...state.uploads] })),
  deleteUpload: (id) => {
    const upload = get().uploads.find((item) => item.id === id);
    if (!upload || upload.ownerUserId !== currentUser.id) return false;
    revokeUploadPreviewUrl(id);
    set((state) => ({ uploads: state.uploads.filter((item) => item.id !== id) }));
    return true;
  },
  updateStudy: (id, changes) => {
    const upload = get().uploads.find((item) => item.id === id);
    if (!upload || upload.ownerUserId !== currentUser.id) return false;
    set((state) => ({ uploads: state.uploads.map((item) => item.id === id ? { ...item, ...changes, updatedAt: new Date().toISOString() } : item) }));
    return true;
  },
  resetUploads: () => { previewUrls.forEach((url) => URL.revokeObjectURL(url)); previewUrls.clear(); set({ uploads: mockUploads }); },
}), { name: STORAGE_KEYS.uploads, version: 3, migrate: migratePersistedUploadState, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: (state) => ({ uploads: state.uploads }) }));

export const hydrateUploadStore = async (): Promise<void> => { await useUploadStore.persist.rehydrate(); };
