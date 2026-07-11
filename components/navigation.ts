import { Bot, Camera, Dumbbell, Gamepad2, Gauge, GraduationCap, Swords, Trophy, type LucideIcon } from "lucide-react";

export type NavigationItem = { href: string; label: string; icon: LucideIcon; future?: boolean };
export const navigationItems: NavigationItem[] = [
  { href: "/", label: "Dashboard", icon: Gauge },
  { href: "/partidas", label: "Minhas Partidas", icon: Swords },
  { href: "/enviar-imagem", label: "Enviar Imagem", icon: Camera },
  { href: "/treinamento", label: "Treinamento", icon: Dumbbell },
  { href: "/jogar", label: "Jogar", icon: Gamepad2 },
  { href: "/ranking", label: "Ranking", icon: Trophy },
  { href: "/futura-ia", label: "Professor IA", icon: Bot },
  { href: "/professor-humano", label: "Professor humano", icon: GraduationCap },
];
