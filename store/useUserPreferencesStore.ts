import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";

interface UserPreferencesStore {
  includeExternalGames: boolean;
  setIncludeExternalGames: (include: boolean) => void;
}

export const useUserPreferencesStore = create<UserPreferencesStore>()(persist((set) => ({
  includeExternalGames: false,
  setIncludeExternalGames: (includeExternalGames) => set({ includeExternalGames }),
}), {
  name: STORAGE_KEYS.preferences,
  version: 1,
  storage: createJSONStorage(getSafeStorage),
  skipHydration: true,
}));

export const hydrateUserPreferencesStore = async (): Promise<void> => {
  await useUserPreferencesStore.persist.rehydrate();
};
