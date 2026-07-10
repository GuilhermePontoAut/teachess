import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { mockUploads } from "@/lib/data/uploads";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { UploadedPosition } from "@/lib/types/chess";

interface UploadStore {
  uploads: UploadedPosition[];
  addUpload: (upload: UploadedPosition) => void;
  deleteUpload: (id: string) => void;
  resetUploads: () => void;
}

export const useUploadStore = create<UploadStore>()(persist((set) => ({
  uploads: mockUploads,
  addUpload: (upload) => set((state) => ({ uploads: [upload, ...state.uploads] })),
  deleteUpload: (id) => set((state) => ({ uploads: state.uploads.filter((upload) => upload.id !== id) })),
  resetUploads: () => set({ uploads: mockUploads }),
}), { name: STORAGE_KEYS.uploads, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: (state) => ({ uploads: state.uploads }) }));

export const hydrateUploadStore = async (): Promise<void> => { await useUploadStore.persist.rehydrate(); };
