import type { ChessGame } from "@/lib/types/chess";
import type { TopicRecommendation } from "./training";
import { TrainingTopicCard } from "./TrainingTopicCard";

export function RecommendedTopics({ topics, addedTopicIds, games, onAdd }: { topics: TopicRecommendation[]; addedTopicIds: string[]; games: ChessGame[]; onAdd: (topic: TopicRecommendation) => void }) {
  return <section aria-labelledby="recommended-topics-title"><h2 id="recommended-topics-title" className="text-xl font-semibold">Temas recomendados</h2><p className="mt-1 text-sm text-muted">Prioridade calculada de forma determinística a partir dos mocks disponíveis.</p><div className="mt-4 grid gap-4 lg:grid-cols-2">{topics.map((topic) => <TrainingTopicCard key={topic.id} topic={topic} added={addedTopicIds.includes(topic.id)} relatedGame={games.find((game) => topic.relatedGameIds.includes(game.id))} onAdd={() => onAdd(topic)} />)}</div></section>;
}
