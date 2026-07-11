"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { GameForm } from "./GameForm";
import { emptyGameFormValues, formValuesToGameData } from "./gameForm";

export function NewGameContent() {
  const router = useRouter();
  const addGame = useGameStore((state) => state.addGame);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { let active = true; void hydrateGameStore().finally(() => { if (active) setHydrated(true); }); return () => { active = false; }; }, []);
  if (!hydrated) return <GameFormLoading title="Adicionar partida externa" description="Cadastre uma partida jogada fora do TeaChess." />;
  return <div className="space-y-6"><PageTitle eyebrow="Histórico privado" title="Adicionar partida externa" description="Cadastre manualmente uma partida jogada fora do TeaChess." /><MockNotice>Esta partida foi jogada fora do TeaChess e será adicionada manualmente. Ela será privada, não contará para o ranking e não alterará as estatísticas públicas da plataforma.</MockNotice><GameForm mode="create" initialValues={emptyGameFormValues} onCancel={() => router.push("/partidas")} onSubmit={(values) => { const now = new Date().toISOString(); addGame({ id: crypto.randomUUID(), ...formValuesToGameData(values), status: "finished", createdAt: now, updatedAt: now }); router.push("/partidas?success=created"); }} /></div>;
}

export function GameFormLoading({ title, description }: { title: string; description: string }) {
  return <div role="status" aria-live="polite" className="space-y-6"><PageTitle eyebrow="Histórico" title={title} description={description} /><div className="animate-pulse rounded-2xl border border-line bg-surface p-6"><div className="h-5 w-52 rounded bg-neutral-200" /><div className="mt-5 grid gap-4 sm:grid-cols-2"><div className="h-11 rounded-xl bg-neutral-100" /><div className="h-11 rounded-xl bg-neutral-100" /></div><span className="sr-only">Carregando formulário…</span></div></div>;
}
