import { CalendarDays } from "lucide-react";
import type { TrainingActivity } from "./training";
import { StudyDayCard } from "./StudyDayCard";

export function WeeklyStudyPlan({ activities, onToggle }: { activities: TrainingActivity[]; onToggle: (id: string) => void }) {
  const completed = activities.filter((item) => item.completedAt).length;
  const progress = activities.length ? Math.round(completed / activities.length * 100) : 0;
  if (!activities.length) return <section className="rounded-2xl border border-dashed border-line-strong bg-white px-6 py-14 text-center"><CalendarDays className="mx-auto text-neutral-400" size={36} /><h2 className="mt-4 text-lg font-semibold">Seu plano está vazio</h2><p className="mt-2 text-sm text-muted">Adicione um tema recomendado para criar a próxima atividade.</p></section>;
  return <section aria-labelledby="weekly-plan-title"><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 id="weekly-plan-title" className="text-xl font-semibold">Plano semanal</h2><p className="mt-1 text-sm text-muted">{completed} de {activities.length} atividades concluídas ({progress}%).</p></div><div className="h-2 w-full overflow-hidden rounded-full bg-neutral-200 sm:w-48" role="progressbar" aria-label="Progresso do plano semanal" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}><div className="h-full bg-green-700" style={{ width: `${progress}%` }} /></div></div><div className="grid gap-3 lg:grid-cols-2">{activities.map((activity) => <StudyDayCard key={activity.id} activity={activity} onToggle={() => onToggle(activity.id)} />)}</div></section>;
}
