import type {
  FutureAiInteraction,
  ProfessorAnswerContent,
  ProfessorToolDecision,
} from "@/lib/future-ai/demo";

const evidenceStatusLabels: Record<
  ProfessorAnswerContent["evidenceStatus"],
  string
> = {
  sufficient: "Evidências suficientes",
  partial: "Evidências parciais",
  insufficient: "Evidências insuficientes",
};

function sourceLabel(decision: ProfessorToolDecision | null): string {
  if (decision === null) return "Resposta preservada do histórico anterior";
  if (decision.status === "not_called") {
    return "Resposta sem consulta aos dados selecionados";
  }
  return decision.name === "get_game_context"
    ? "Fonte consultada: partida selecionada"
    : "Fonte consultada: posição selecionada";
}

function Section({
  title,
  items,
  ordered = false,
}: {
  title: string;
  items: string[];
  ordered?: boolean;
}) {
  const List = ordered ? "ol" : "ul";
  return (
    <section>
      <h4 className="text-sm font-bold text-neutral-950">{title}</h4>
      {items.length > 0 ? (
        <List
          className={`mt-1 space-y-1 pl-5 text-sm leading-6 text-neutral-700 ${ordered ? "list-decimal" : "list-disc"}`}
        >
          {items.map((item, index) => (
            <li key={`${index}-${item}`}>{item}</li>
          ))}
        </List>
      ) : (
        <p className="mt-1 text-sm leading-6 text-muted">Nenhum item informado.</p>
      )}
    </section>
  );
}

export function ProfessorAnswer({ answer }: { answer: ProfessorAnswerContent }) {
  return (
    <div className="space-y-4">
      <section>
        <h4 className="text-sm font-bold text-neutral-950">Resumo</h4>
        <p className="mt-1 text-sm leading-6 text-neutral-700">{answer.summary}</p>
      </section>
      <Section title="O que observar" items={answer.observations} />
      <Section title="Pontos fortes" items={answer.strengths} />
      <Section title="Pontos a melhorar" items={answer.improvements} />
      <Section
        title="Recomendações de estudo"
        items={answer.studyRecommendations}
        ordered
      />
      <Section title="Evidências utilizadas" items={answer.evidenceUsed} />
      <Section title="Limitações" items={answer.limitations} />
      <p className="w-fit rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-semibold text-neutral-700">
        {evidenceStatusLabels[answer.evidenceStatus]}
      </p>
    </div>
  );
}

export function ProfessorConversation({
  interactions,
}: {
  interactions: FutureAiInteraction[];
}) {
  if (!interactions.length) {
    return (
      <div className="rounded-xl border border-dashed border-line-strong bg-neutral-50 px-5 py-10 text-center">
        <h3 className="font-semibold">Conversa vazia</h3>
        <p className="mt-2 text-sm text-muted">
          Escolha um contexto e faça uma pergunta para consultar o Professor IA.
        </p>
      </div>
    );
  }

  return (
    <ol aria-label="Histórico da conversa com o Professor IA" className="space-y-5">
      {interactions.map((item) => (
        <li
          id={`interaction-${item.id}`}
          key={item.id}
          className="scroll-mt-24 space-y-3"
        >
          <article
            aria-label={`Pergunta: ${item.question}`}
            className="ml-auto max-w-[92%] rounded-2xl rounded-br-sm bg-neutral-950 p-4 text-white"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
              Você · {item.context.legacy ? "Contexto antigo da demonstração" : item.context.label}
            </p>
            <p className="mt-1 text-sm leading-6">{item.question}</p>
          </article>
          <article
            aria-label="Resposta do Professor IA"
            className="max-w-[96%] rounded-2xl rounded-bl-sm border border-line bg-white p-5"
          >
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <span className="rounded-full bg-neutral-950 px-2.5 py-1 text-xs font-bold text-white">
                Professor IA
              </span>
              <time className="text-xs text-muted" dateTime={item.createdAt}>
                {new Date(item.createdAt).toLocaleTimeString("pt-BR", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
            <ProfessorAnswer answer={item.answer} />
            <p className="mt-4 border-t border-line pt-3 text-xs font-semibold text-muted">
              {sourceLabel(item.toolDecision)}
            </p>
          </article>
        </li>
      ))}
    </ol>
  );
}
