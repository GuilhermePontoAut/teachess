import type { ChessGame, GameAnalysis, TrainingTopic, UploadedPosition } from "@/lib/types/chess";

export type FutureAiContextType = "game-analysis" | "saved-position";
export type LegacyFutureAiContextType = "game" | "analysis" | "position" | "training" | "none" | "no-context" | "unknown";
export type FutureAiTab = "professor" | "capabilities" | "architecture" | "roadmap";

export interface FutureAiContextRef { type: FutureAiContextType | LegacyFutureAiContextType; id: string | null; label: string; legacy?: boolean; }
export interface SimulatedAnswerContent { summary: string; observations: string[]; learning: string; plan: string[]; nextQuestion: string; contextUsed: string; }
export interface FutureAiInteraction { id: string; question: string; context: FutureAiContextRef; answer: SimulatedAnswerContent; createdAt: string; }
export interface DemoContextData { game?: ChessGame; analysis?: GameAnalysis; position?: UploadedPosition; training?: TrainingTopic & { progress: number }; }

export const contextTypeLabels: Record<FutureAiContextType, string> = { "game-analysis": "Análise de partida", "saved-position": "Posição específica" };
export const errorCategoryLabels = { opening: "Abertura", tactics: "Tática", strategy: "Estratégia", time_management: "Gestão do tempo", calculation: "Cálculo", endgame: "Final" } as const;

const questions: Record<FutureAiContextType, string[]> = {
  "game-analysis": ["Onde comecei a perder vantagem?", "Qual foi meu principal erro?", "O que fiz bem nesta partida?", "Que tema devo estudar?", "Explique esta partida para um iniciante."],
  "saved-position": ["Quais são os planos desta posição?", "Quais peças estão mal posicionadas?", "Existe alguma ameaça imediata?", "O que devo analisar antes de jogar?", "Como um professor explicaria esta posição?"],
};
export const getSuggestedQuestions = (type: FutureAiContextType): string[] => questions[type];

const includes = (question: string, terms: string[]) => terms.some((term) => question.toLocaleLowerCase("pt-BR").includes(term));
const genericAnswer = (context: FutureAiContextRef, question: string): SimulatedAnswerContent => ({
  summary: "Este exemplo representa o tipo de explicação didática planejada. Sem dados técnicos vinculados, a demonstração organiza um método de estudo, sem avaliar lances ou inventar conclusões sobre o tabuleiro.",
  observations: includes(question, ["professor", "iniciante"]) ? ["Comece pelo objetivo da posição ou da partida.", "Separe fatos disponíveis de hipóteses a investigar.", "Use perguntas curtas e confirme cada conclusão."] : ["Identifique o momento ou tema que deseja revisar.", "Registre suas candidatas antes de consultar material técnico.", "Transforme a revisão em uma ação pequena e verificável."],
  learning: "Uma explicação útil deve mostrar o raciocínio e declarar quando não há evidência suficiente.",
  plan: ["Escolher um recorte de estudo.", "Anotar decisões e dúvidas.", "Revisar com fonte técnica apropriada ou professor humano."],
  nextQuestion: "Que dado adicional tornaria esta revisão mais útil?",
  contextUsed: context.label,
});

export function createSimulatedAnswer(context: FutureAiContextRef, question: string, data: DemoContextData): SimulatedAnswerContent {
  if (context.type === "game-analysis" && data.game) {
    const analysis = data.analysis;
    if (!analysis) return { ...genericAnswer(context, question), summary: `A partida “${data.game.title}” está disponível, mas não possui conteúdo analítico mockado suficiente. Uma futura análise poderia investigar os momentos críticos; nesta versão nenhum lance é avaliado.`, observations: [data.game.notes || "Não há observações pessoais registradas.", `Status demonstrativo: ${data.game.analysisStatus === "pending" ? "pendente" : "não analisada"}.`, "Nenhum cálculo de engine foi criado para preencher a ausência."], learning: "A falta de dados deve permanecer visível; o sistema não deve completar lacunas com afirmações técnicas.", contextUsed: `${contextTypeLabels[context.type]}: ${data.game.title}` };
    const moment = analysis.criticalMoments[0];
    const focus = includes(question, ["bem", "ponto forte"]) ? `O conteúdo mockado destaca ${analysis.strengths.join(" e ").toLocaleLowerCase("pt-BR")}.` : includes(question, ["erro", "perder", "momento"]) ? `O conteúdo mockado chama atenção para ${analysis.weaknesses.join(" e ").toLocaleLowerCase("pt-BR")}.` : analysis.summary;
    return { summary: `${focus} Esta conclusão foi retirada da análise mockada vinculada, não de um modelo de IA ou motor de xadrez.`, observations: [`Pontos fortes registrados: ${analysis.strengths.join(", ")}.`, `Pontos a melhorar: ${analysis.weaknesses.join(", ")}.`, moment ? `Momento crítico mockado: lance ${moment.moveNumber}, descrito como “${moment.description}”` : "Nenhum momento crítico foi registrado."], learning: analysis.recommendation, plan: [`Revisar ${analysis.errorCategories.map((item) => errorCategoryLabels[item]).join(" e ").toLocaleLowerCase("pt-BR")}.`, moment ? `Reconstruir a decisão do lance ${moment.moveNumber} sem buscar uma resposta automática.` : "Selecionar um momento da partida para revisão.", "Comparar suas anotações com um professor ou fonte técnica apropriada."], nextQuestion: "Como posso praticar esse aprendizado em uma sessão curta?", contextUsed: `${contextTypeLabels[context.type]}: ${data.game.title} · análise ${analysis.id}` };
  }
  if (context.type === "saved-position" && data.position) {
    if (!data.position.simulatedDetectedFen) return { ...genericAnswer(context, question), summary: `A posição “${data.position.title}” não possui FEN demonstrativo. Sem uma representação revisável do tabuleiro, esta demonstração não sugere planos, ameaças ou peças mal posicionadas.`, observations: ["A imagem permanece privada.", "O reconhecimento demonstrativo está incompleto.", "Uma revisão humana pode confirmar a posição antes de qualquer análise futura."], learning: "Uma futura experiência deve validar a posição reconhecida com o jogador antes de usá-la.", contextUsed: `Posição privada: ${data.position.title} · sem FEN demonstrativo` };
    return { summary: "Este exemplo representa como uma futura explicação poderia orientar a observação da posição. O FEN exibido é mockado e nenhuma avaliação técnica foi executada.", observations: includes(question, ["ameaça"]) ? ["Verifique xeques, capturas e ameaças de ambos os lados.", "Confirme a segurança dos reis e peças sem defesa.", "Não há afirmação de ameaça concreta nesta demonstração."] : ["Compare atividade, segurança dos reis e estrutura de peões.", "Identifique a peça menos ativa antes de escolher um plano.", "A alternativa futura deverá ser validada por um motor apropriado ou professor."], learning: "Na demonstração, a sugestão é organizar candidatos antes de calcular; ela não indica o melhor lance.", plan: ["Confirmar se o FEN mockado corresponde à imagem.", "Listar desequilíbrios visuais.", "Pedir revisão privada a um professor quando disponível."], nextQuestion: "Quais candidatos devo comparar depois de validar a posição?", contextUsed: `Posição privada: ${data.position.title} · FEN demonstrativo disponível` };
  }
  return genericAnswer(context, question);
}
