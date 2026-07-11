"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";
import type { ChessGame } from "@/lib/types/chess";
import { hydrateGameStore, useGameStore } from "@/store/useGameStore";
import { GameForm } from "./GameForm";
import { formValuesToGameData, gameToFormValues } from "./gameForm";
import { GameFormLoading } from "./NewGameContent";

export function EditGameContent({ id }: { id: string }) {
  const router = useRouter();
  const getGameById = useGameStore((state) => state.getGameById);
  const updateGame = useGameStore((state) => state.updateGame);
  const [game, setGame] = useState<ChessGame | null | undefined>(undefined);
  useEffect(() => { let active = true; void hydrateGameStore().then(() => { if (active) setGame(getGameById(id) ?? null); }); return () => { active = false; }; }, [getGameById, id]);
  if (game === undefined) return <GameFormLoading title="Editar partida" description="Carregando os dados armazenados neste navegador." />;
  if (game === null) return <div className="space-y-6"><PageTitle eyebrow="Histórico" title="Partida não encontrada" description="Não foi possível localizar esta partida nos dados armazenados neste navegador." /><div className="rounded-2xl border border-line bg-surface p-6 shadow-sm"><p className="text-sm leading-6 text-muted">Ela pode ter sido excluída ou o endereço acessado pode estar incorreto.</p><Link href="/partidas" className="mt-5 inline-flex items-center gap-2 rounded-xl bg-neutral-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-neutral-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><ArrowLeft size={17} aria-hidden="true" />Voltar para partidas</Link></div></div>;
  return <div className="space-y-6"><PageTitle eyebrow="Histórico" title="Editar partida" description={`Atualize os dados da partida contra ${game.opponent}.`} /><MockNotice>Os dados desta partida são armazenados somente neste navegador. A precisão e o status da análise são simulados nesta versão.</MockNotice><GameForm mode="edit" initialValues={gameToFormValues(game)} onCancel={() => router.push("/partidas")} onSubmit={(values) => { updateGame(game.id, { ...formValuesToGameData(values), status: game.status, updatedAt: new Date().toISOString() }); router.push("/partidas?success=updated"); }} /></div>;
}
