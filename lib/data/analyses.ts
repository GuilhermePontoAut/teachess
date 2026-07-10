import type { CriticalMoment, ErrorCategory, GameAnalysis } from "@/lib/types/chess";

const categories: ErrorCategory[] = ["opening", "tactics", "calculation", "endgame", "strategy", "time_management", "endgame", "strategy"];
const momentFens = [
  "r2q1rk1/ppp2ppp/2n1b3/3n4/2B5/5N2/PP3PPP/2RQR1K1 w - - 0 13",
  "r1b2rk1/p2nqpp1/1p2p2p/2pp4/2PP4/Q1N1PN2/PP2BPPP/2R2RK1 w - - 2 16",
  "r2q1rk1/3nb1pp/p2p1p2/1p1Pp1Pn/4P3/1NN2P2/PPPQ4/2KR1B1R w - - 2 13",
  "8/2r2pp1/p3b2p/1p1p4/8/P3PNP1/1PR2PKP/8 w - - 0 31",
  "r4rk1/pb2qppp/1pn1p3/3pP3/3P1P2/2P1P2Q/PP1N2PP/R3KBNR w KQ - 3 12",
  "r3k2r/pp1n1ppp/2p1p3/q1bP4/N4B2/5N2/PPPP1PPP/R2QK2R b KQkq - 1 11",
  "3r2k1/pp3pp1/1p2p2p/3nP3/3R1P2/1N5P/PPP3P1/6K1 w - - 2 28",
  "r1bq1rk1/pp2n1bp/2pp1np1/2pPpp2/2P1P3/2N2N2/PP2BPPP/R1BQ1RK1 w - - 4 10",
];

const makeMoment = (index: number): CriticalMoment => ({
  id: `moment-${index + 1}`,
  moveNumber: [13, 16, 13, 31, 12, 11, 28, 10][index],
  move: ["Ne4", "Ba6", "Nd5", "Rc5", "g4", "Qa5", "Nf8", "Re1"][index],
  fen: momentFens[index],
  category: categories[index],
  severity: index % 3 === 2 ? "blunder" : index % 2 ? "mistake" : "inaccuracy",
  description: ["A peça avançou sem apoio suficiente.", "A troca aliviou a pressão adversária.", "A ruptura central foi calculada de forma incompleta.", "Havia uma defesa mais ativa no final.", "O avanço criou casas fracas.", "A dama saiu cedo e atrasou o desenvolvimento.", "O peão passado poderia ser bloqueado antes.", "O plano na ala ignorou a reação central."][index],
  suggestion: ["Complete o desenvolvimento antes de iniciar o ataque.", "Mantenha a tensão e melhore a pior peça.", "Confira todas as capturas e xeques da variante.", "Ative a torre atrás do peão passado.", "Prepare o avanço com uma peça de apoio.", "Priorize roque e desenvolvimento.", "Coloque o rei próximo do centro.", "Reaja no centro antes de atacar na ala."][index],
  evaluationBefore: [0.7, 0.2, 0.5, -0.1, 1.1, -0.4, 0.8, -0.2][index],
  evaluationAfter: [0.1, -0.7, -2.4, -1.0, 0.2, 1.8, 0.0, 1.1][index],
});

export const mockAnalyses: GameAnalysis[] = Array.from({ length: 8 }, (_, index) => ({
  id: `analysis-${String(index + 1).padStart(2, "0")}`,
  gameId: `game-${String(index + 1).padStart(2, "0")}`,
  summary: ["Ataque bem conduzido após desenvolvimento harmonioso.", "Defesa sólida e boa transição para posição equilibrada.", "A iniciativa se perdeu após uma ruptura tática no centro.", "Final equilibrado defendido com precisão.", "Plano consistente contra uma estrutura passiva.", "O rei permaneceu vulnerável no centro.", "Boa conversão de vantagem posicional.", "O contra-ataque central chegou tarde demais."][index],
  strengths: [["Atividade das torres", "Coordenação"], ["Defesa", "Paciência"], ["Abertura", "Espírito de luta"], ["Final de torres", "Profilaxia"], ["Planejamento", "Controle de espaço"], ["Criação de complicações", "Resiliência"], ["Peão passado", "Técnica"], ["Conhecimento da abertura", "Atividade"]][index],
  weaknesses: [["Cálculo curto"], ["Gestão do tempo"], ["Tática", "Cálculo"], ["Atividade do rei"], ["Casas escuras"], ["Desenvolvimento", "Segurança do rei"], ["Precisão no final"], ["Estratégia", "Tempo"]][index],
  criticalMoments: [makeMoment(index)],
  errorCategories: [categories[index]],
  evaluationHistory: [0, 4, 8, 12, 16, 20].map((move, point) => ({ move, evaluation: Number(((index % 2 ? -1 : 1) * point * 0.18).toFixed(2)) })),
  simulatedAccuracy: [87.4, 82.1, 61.8, 84.6, 90.2, 58.9, 88.3, 64.5][index],
  recommendation: ["Treinar cálculo de três lances.", "Praticar decisões com relógio reduzido.", "Resolver padrões de ruptura central.", "Revisar finais de torre e peão.", "Estudar a criação de casas fracas.", "Priorizar desenvolvimento e segurança do rei.", "Treinar conversão de peões passados.", "Revisar planos típicos da Índia do Rei."][index],
  createdAt: `2026-0${index < 2 ? 6 : 5}-${String(15 - index).padStart(2, "0")}T12:00:00.000Z`,
}));
