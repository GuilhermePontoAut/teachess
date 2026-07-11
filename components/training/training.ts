import type { ChessGame, CoachRecommendation, ErrorCategory, GameAnalysis, TrainingTopic } from "@/lib/types/chess";

export type TrainingPriority = "high" | "medium" | "low";
export type ActivityType = "study" | "exercise" | "review" | "game_analysis";
export type ExerciseStatus = "not_started" | "in_progress" | "completed";

export interface TrainingActivity {
  id: string;
  day: string;
  title: string;
  topicId: string;
  topicTitle: string;
  type: ActivityType;
  estimatedMinutes: number;
  priority: TrainingPriority;
  reason: string;
  completedAt: string | null;
}

export interface TrainingExercise {
  id: string;
  title: string;
  topicId: string;
  topicTitle: string;
  category: ErrorCategory;
  description: string;
  difficulty: TrainingTopic["level"];
  estimatedMinutes: number;
  questionCount: number;
  priority: TrainingPriority;
  recommendationOrigin: string;
}

export interface ExerciseProgress { status: ExerciseStatus; progress: number; completedAt: string | null }
export interface CompletionEntry { id: string; kind: "activity" | "exercise"; title: string; topicId: string; completedAt: string; minutes: number }
export interface TopicRecommendation extends TrainingTopic {
  priority: TrainingPriority;
  frequency: number;
  reason: string;
  relatedGameIds: string[];
  fallback: boolean;
}

export const categoryLabels: Record<ErrorCategory, string> = {
  opening: "Abertura", tactics: "Tática", strategy: "Estratégia", time_management: "Gestão do tempo", calculation: "Cálculo", endgame: "Finais",
};
export const levelLabels: Record<TrainingTopic["level"], string> = { beginner: "Iniciante", intermediate: "Intermediário", advanced: "Avançado" };
export const priorityLabels: Record<TrainingPriority, string> = { high: "Alta", medium: "Média", low: "Baixa" };
export const activityTypeLabels: Record<ActivityType, string> = { study: "Estudo", exercise: "Exercício", review: "Revisão", game_analysis: "Análise de partida" };

const categoryTopicMap: Record<ErrorCategory, string[]> = {
  tactics: ["training-01", "training-07"], calculation: ["training-02"], strategy: ["training-03", "training-09"], endgame: ["training-04", "training-08"], opening: ["training-05", "training-10"], time_management: ["training-06"],
};

export function deriveRecommendations(topics: TrainingTopic[], analyses: GameAnalysis[], recommendations: CoachRecommendation[], games: ChessGame[] = []): TopicRecommendation[] {
  const counts = analyses.flatMap((analysis) => [...analysis.errorCategories, ...analysis.criticalMoments.map((moment) => moment.category)]).reduce<Map<ErrorCategory, number>>((map, category) => map.set(category, (map.get(category) ?? 0) + 1), new Map());
  const enoughData = analyses.length >= 2;
  const losses = games.filter((game) => game.result === "loss").length;
  const openingCounts = games.reduce<Map<string, number>>((map, game) => game.opening ? map.set(game.opening, (map.get(game.opening) ?? 0) + 1) : map, new Map());
  const mostPlayedOpening = [...openingCounts].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"))[0];
  const weaknessText = analyses.flatMap((analysis) => analysis.weaknesses).join(" ").toLocaleLowerCase("pt-BR");
  const strengthText = analyses.flatMap((analysis) => analysis.strengths).join(" ").toLocaleLowerCase("pt-BR");
  const relatedByCategory = (category: ErrorCategory) => analyses.filter((analysis) => analysis.errorCategories.includes(category) || analysis.criticalMoments.some((moment) => moment.category === category)).map((analysis) => analysis.gameId);
  const result = topics.map((topic) => {
    const frequency = counts.get(topic.category) ?? 0;
    const coach = recommendations.find((item) => item.category === topic.category);
    const label = categoryLabels[topic.category].toLocaleLowerCase("pt-BR");
    const weaknessMatch = weaknessText.includes(label) || (topic.category === "opening" && weaknessText.includes("desenvolvimento")) || (topic.category === "time_management" && weaknessText.includes("tempo"));
    const strengthMatch = strengthText.includes(label) || (topic.category === "opening" && strengthText.includes("abertura"));
    const priority: TrainingPriority = frequency >= 3 || coach?.priority === "high" || (weaknessMatch && losses > 0) ? "high" : frequency >= 1 || coach?.priority === "medium" || weaknessMatch ? "medium" : "low";
    const context = topic.category === "opening" && mostPlayedOpening ? ` Sua abertura mais registrada no escopo é ${mostPlayedOpening[0]} (${mostPlayedOpening[1]} ${mostPlayedOpening[1] === 1 ? "partida" : "partidas"}).` : losses > 0 && priority === "high" ? ` O escopo também contém ${losses} ${losses === 1 ? "derrota" : "derrotas"}, reforçando a revisão construtiva.` : strengthMatch ? " Este tema também se conecta a um ponto forte que vale consolidar." : "";
    return { ...topic, priority, frequency, relatedGameIds: relatedByCategory(topic.category), fallback: !enoughData, reason: (enoughData && frequency > 0 ? `${categoryLabels[topic.category]} foi identificada em ${frequency} ${frequency === 1 ? "momento crítico" : "momentos críticos"} das partidas selecionadas.` : `Tema demonstrativo baseado no catálogo ${coach ? "e nas recomendações simuladas" : "de treinamento"} do TeaChess.`) + context };
  });
  const priorityOrder: Record<TrainingPriority, number> = { high: 0, medium: 1, low: 2 };
  return result.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority] || b.frequency - a.frequency || a.title.localeCompare(b.title, "pt-BR"));
}

export function createInitialPlan(topics: TrainingTopic[]): TrainingActivity[] {
  const chosen = topics.slice(0, 5);
  const days = ["Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira"];
  const types: ActivityType[] = ["study", "exercise", "review", "game_analysis", "exercise"];
  return chosen.map((topic, index) => ({ id: `plan-${index + 1}`, day: days[index], title: ["Revisar conceitos essenciais", "Praticar padrões", "Consolidar aprendizados", "Rever uma partida crítica", "Fechar o ciclo com exercícios"][index], topicId: topic.id, topicTitle: topic.title, type: types[index], estimatedMinutes: topic.estimatedMinutes, priority: index < 2 ? "high" : index < 4 ? "medium" : "low", reason: `Sessão demonstrativa priorizada a partir do tema ${topic.title}.`, completedAt: null }));
}

export function createExercises(topics: TrainingTopic[]): TrainingExercise[] {
  return topics.map((topic, index) => ({ id: `exercise-${topic.id}`, title: `Prática: ${topic.title}`, topicId: topic.id, topicTitle: topic.title, category: topic.category, description: topic.description, difficulty: topic.level, estimatedMinutes: topic.estimatedMinutes, questionCount: topic.exerciseCount, priority: index < 3 ? "high" : index < 7 ? "medium" : "low", recommendationOrigin: `Catálogo demonstrativo relacionado a ${categoryLabels[topic.category]}.` }));
}

export const getTopicIdsForCategory = (category: ErrorCategory): string[] => categoryTopicMap[category];
