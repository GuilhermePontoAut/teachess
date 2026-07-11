import { CircleHelp } from "lucide-react";
import { MockNotice } from "@/components/MockNotice";
import { PageTitle } from "@/components/PageTitle";

export function RankingHeader({ onOpenRules }: { onOpenRules: () => void }) {
  return <header className="space-y-4"><div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"><PageTitle eyebrow="Comunidade" title="Ranking" description="Classificação oficial da comunidade TeaChess, baseada exclusivamente em partidas realizadas na plataforma." /><button type="button" onClick={onOpenRules} className="inline-flex min-h-11 shrink-0 items-center justify-center gap-2 rounded-xl border border-line bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"><CircleHelp size={17} aria-hidden="true" />Como funciona o ranking</button></div><MockNotice>O ranking desta versão utiliza dados simulados. Somente partidas realizadas na plataforma contam para as estatísticas oficiais. Partidas externas são privadas e não afetam a classificação.</MockNotice></header>;
}
