import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockUploads } from "@/lib/data/uploads";
import { currentUser } from "@/lib/data/users";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { UploadedPosition } from "@/lib/types/chess";

interface UploadStore {
  uploads: UploadedPosition[];
  addUpload: (upload: UploadedPosition) => void;
  deleteUpload: (id: string) => boolean;
  resetUploads: () => void;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

export function migratePersistedUploadState(state: unknown): { uploads: UploadedPosition[] } {
  if (!isRecord(state) || !Array.isArray(state.uploads)) return { uploads: mockUploads };
  return { uploads: state.uploads.filter(isRecord).map((legacy, index) => {
    const createdAt = typeof legacy.createdAt === "string" ? legacy.createdAt : new Date().toISOString();
    const oldMime = legacy.mimeType === "image/png" || legacy.mimeType === "image/webp" ? legacy.mimeType : "image/jpeg";
    const files = Array.isArray(legacy.files) ? legacy.files : [{ name: typeof legacy.fileName === "string" ? legacy.fileName : `imagem-${index + 1}.jpg`, mimeType: oldMime, sizeInBytes: typeof legacy.sizeInBytes === "number" ? legacy.sizeInBytes : 0 }];
    return {
      id: typeof legacy.id === "string" ? legacy.id : crypto.randomUUID(), ownerUserId: currentUser.id, visibility: "private", title: typeof legacy.title === "string" ? legacy.title : typeof legacy.fileName === "string" ? legacy.fileName : "Envio migrado",
      uploadType: legacy.uploadType === "game_sequence" ? "game_sequence" : "study_position", uploadTypeDetails: typeof legacy.uploadTypeDetails === "string" ? legacy.uploadTypeDetails : "", date: typeof legacy.date === "string" ? legacy.date : createdAt.slice(0, 10),
      source: legacy.source === "chess.com" || legacy.source === "lichess" || legacy.source === "outro" ? legacy.source : "presencial", sourceDetails: typeof legacy.sourceDetails === "string" ? legacy.sourceDetails : "", description: typeof legacy.description === "string" ? legacy.description : "",
      manualFen: typeof legacy.manualFen === "string" ? legacy.manualFen : typeof legacy.extractedFen === "string" ? legacy.extractedFen : null, linkedGameId: typeof legacy.linkedGameId === "string" ? legacy.linkedGameId : null, tags: Array.isArray(legacy.tags) ? legacy.tags.filter((tag): tag is string => typeof tag === "string").slice(0, 10) : [],
      files, imageCount: files.length, status: "metadata_saved", notes: typeof legacy.notes === "string" ? legacy.notes : "", createdAt, updatedAt: typeof legacy.updatedAt === "string" ? legacy.updatedAt : createdAt,
    } as UploadedPosition;
  }) };
}

export const useUploadStore = create<UploadStore>()(persist((set, get) => ({
  uploads: mockUploads,
  addUpload: (upload) => set((state) => ({ uploads: [upload, ...state.uploads] })),
  deleteUpload: (id) => { const upload = get().uploads.find((item) => item.id === id); if (!upload || upload.ownerUserId !== currentUser.id) return false; set((state) => ({ uploads: state.uploads.filter((item) => item.id !== id) })); return true; },
  resetUploads: () => set({ uploads: mockUploads }),
}), { name: STORAGE_KEYS.uploads, version: 2, migrate: migratePersistedUploadState, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: (state) => ({ uploads: state.uploads }) }));

export const hydrateUploadStore = async (): Promise<void> => { await useUploadStore.persist.rehydrate(); };
