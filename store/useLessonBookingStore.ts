import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { getSafeStorage, STORAGE_KEYS } from "@/lib/storage/storage";
import type { LessonBooking } from "@/lib/types/humanTeachers";

interface LessonBookingStore { bookings: LessonBooking[]; selectedTeacherId: string | null; hydrated: boolean; selectTeacher: (id: string | null) => void; addBooking: (booking: LessonBooking) => void; cancelBooking: (id: string) => void; resetBookings: () => void; }
const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const migrateBooking = (item: unknown): LessonBooking | null => {
  if (!isRecord(item) || typeof item.id !== "string" || typeof item.teacherId !== "string" || typeof item.teacherName !== "string" || typeof item.date !== "string" || typeof item.time !== "string" || typeof item.durationMinutes !== "number" || typeof item.price !== "number" || typeof item.createdAt !== "string") return null;
  return {
    id: item.id,
    teacherId: item.teacherId,
    teacherName: item.teacherName,
    date: item.date,
    time: item.time,
    durationMinutes: item.durationMinutes,
    format: "online",
    price: item.price,
    topic: typeof item.topic === "string" ? item.topic : "",
    notes: typeof item.notes === "string" ? item.notes : "",
    status: item.status === "Cancelado localmente" ? "Cancelado localmente" : "Agendamento simulado",
    createdAt: item.createdAt,
  };
};

const migrateBookings = (value: unknown): Pick<LessonBookingStore, "bookings" | "selectedTeacherId"> => {
  if (!isRecord(value)) return { bookings: [], selectedTeacherId: null };
  const bookings = Array.isArray(value.bookings) ? value.bookings.map(migrateBooking).filter((booking): booking is LessonBooking => booking !== null) : [];
  return { bookings, selectedTeacherId: typeof value.selectedTeacherId === "string" ? value.selectedTeacherId : null };
};

export const useLessonBookingStore = create<LessonBookingStore>()(persist((set) => ({
  bookings: [],
  selectedTeacherId: null,
  hydrated: false,
  selectTeacher: (selectedTeacherId) => set({ selectedTeacherId }),
  addBooking: (booking) => set((state) => ({ bookings: [booking, ...state.bookings] })),
  cancelBooking: (id) => set((state) => ({ bookings: state.bookings.map((booking) => booking.id === id ? { ...booking, status: "Cancelado localmente" } : booking) })),
  resetBookings: () => set({ bookings: [], selectedTeacherId: null }),
}), { name: STORAGE_KEYS.lessonBookings, version: 2, storage: createJSONStorage(getSafeStorage), skipHydration: true, partialize: ({ bookings, selectedTeacherId }) => ({ bookings, selectedTeacherId }), migrate: migrateBookings, merge: (persisted, current) => ({ ...current, ...migrateBookings(persisted) }), onRehydrateStorage: () => () => useLessonBookingStore.setState({ hydrated: true }) }));

export const hydrateLessonBookingStore = async (): Promise<void> => { await useLessonBookingStore.persist.rehydrate(); useLessonBookingStore.setState({ hydrated: true }); };
