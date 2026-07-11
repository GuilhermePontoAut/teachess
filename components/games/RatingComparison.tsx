import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";

interface RatingComparisonProps {
  ratingAtGame?: number;
  currentRating?: number;
  label: string;
  externalContext?: boolean;
  compact?: boolean;
}

export function RatingComparison({ ratingAtGame, currentRating, label, externalContext = false, compact = false }: RatingComparisonProps) {
  const historicalRatingMissing = ratingAtGame === undefined;
  const difference = historicalRatingMissing || currentRating === undefined ? undefined : currentRating - ratingAtGame;
  const tone = difference === undefined || difference === 0 ? "border-neutral-200 bg-neutral-50 text-neutral-700" : difference > 0 ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800";
  const Icon = difference === undefined || difference === 0 ? ArrowRight : difference > 0 ? ArrowUp : ArrowDown;
  const differenceText = historicalRatingMissing ? "Rating na partida não informado" : difference === undefined ? "Rating atual não disponível" : difference === 0 ? "Sem alteração" : `${difference > 0 ? "+" : ""}${difference} pontos desde esta partida`;

  if (compact) return <div className={`rounded-lg border px-2.5 py-2 text-xs ${tone}`} aria-label={`${label}: ${differenceText}. Rating atual ${currentRating ?? "não disponível"}.`}><span className="font-semibold">{ratingAtGame ?? "Não informado"}</span><Icon className="mx-1 inline" size={13} aria-hidden="true" />{currentRating ?? "—"}<span className="ml-1 font-medium">({difference === undefined ? "indisponível" : difference === 0 ? "0" : `${difference > 0 ? "+" : ""}${difference}`})</span></div>;

  return <section className={`rounded-2xl border p-4 ${tone}`} aria-label={`Comparação de rating de ${label}`}>
    <p className="text-sm font-semibold">{label}</p>
    <dl className="mt-3 grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs opacity-75">Rating na partida</dt><dd className="mt-1 text-lg font-bold">{ratingAtGame ?? "Não informado"}</dd></div><div><dt className="text-xs opacity-75">Rating atual no TeaChess</dt><dd className="mt-1 text-lg font-bold">{currentRating ?? "Não disponível"}</dd></div></dl>
    <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold"><Icon size={16} aria-hidden="true" />{differenceText}</p>
    <p className="mt-2 text-xs leading-5 opacity-80">{externalContext ? "A diferença apresentada é apenas uma comparação histórica com o rating oficial atual do TeaChess. Esta partida externa não alterou o rating da plataforma." : "Comparação entre o registro histórico da partida e o rating oficial atual do perfil."}</p>
  </section>;
}
