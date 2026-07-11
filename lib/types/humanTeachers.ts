export type ChessTitle = "Sem título" | "CM" | "FM" | "IM" | "GM" | "WCM" | "WFM" | "WIM" | "WGM";
export type LessonFormat = "online";
export type TeacherStatus = "disponível" | "agenda limitada" | "indisponível";
export type TeacherSpecialty = "Iniciantes" | "Tática" | "Estratégia" | "Aberturas" | "Finais" | "Preparação para torneios" | "Análise de partidas" | "Xadrez infantil";
export interface TeacherSlot { id: string; date: string; time: string; available: boolean; }
export interface HumanTeacher { id: string; name: string; initials: string; region: string; languages: string[]; title: ChessTitle; rating: number; specialties: TeacherSpecialty[]; audiences: string[]; bio: string; methodology: string; experienceYears: number; price: number; durationMinutes: number; reviewScore: number; reviewCount: number; slots: TeacherSlot[]; status: TeacherStatus; verified: boolean; createdAt: string; }
export type BookingStatus = "Agendamento simulado" | "Cancelado localmente";
export interface LessonBooking { id: string; teacherId: string; teacherName: string; date: string; time: string; durationMinutes: number; format: LessonFormat; price: number; topic: string; notes: string; status: BookingStatus; createdAt: string; }
