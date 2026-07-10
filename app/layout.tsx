import type { Metadata } from "next";
import { AppShell } from "@/components/AppShell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "TeaChess", template: "%s | TeaChess" },
  description: "Seu espaço para aprender, praticar e evoluir no xadrez.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="pt-BR"><body className="antialiased"><AppShell>{children}</AppShell></body></html>;
}
