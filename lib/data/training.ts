import type { TrainingTopic } from "@/lib/types/chess";

export const mockTrainingTopics: TrainingTopic[] = [
  { id:"training-01", title:"Garfo e ataque duplo", description:"Reconheça ataques simultâneos às peças adversárias.", category:"tactics", level:"beginner", estimatedMinutes:15, progress:100, completed:true, exerciseCount:12 },
  { id:"training-02", title:"Cálculo de lances forçados", description:"Organize candidatos, xeques, capturas e ameaças.", category:"calculation", level:"intermediate", estimatedMinutes:25, progress:60, completed:false, exerciseCount:10 },
  { id:"training-03", title:"Planos na estrutura Carlsbad", description:"Pratique ataque da minoria e jogo central.", category:"strategy", level:"advanced", estimatedMinutes:35, progress:20, completed:false, exerciseCount:8 },
  { id:"training-04", title:"Finais de rei e peão", description:"Domine oposição, casas-chave e peões passados.", category:"endgame", level:"beginner", estimatedMinutes:20, progress:80, completed:false, exerciseCount:14 },
  { id:"training-05", title:"Desenvolvimento na abertura", description:"Evite saídas prematuras da dama e perda de tempos.", category:"opening", level:"beginner", estimatedMinutes:15, progress:100, completed:true, exerciseCount:10 },
  { id:"training-06", title:"Relógio e decisões práticas", description:"Distribua o tempo nos momentos críticos.", category:"time_management", level:"intermediate", estimatedMinutes:20, progress:40, completed:false, exerciseCount:6 },
  { id:"training-07", title:"Cravadas e raios X", description:"Explore alinhamentos de rei, dama e torres.", category:"tactics", level:"intermediate", estimatedMinutes:25, progress:10, completed:false, exerciseCount:16 },
  { id:"training-08", title:"Finais de torres", description:"Ative torre e rei em posições técnicas comuns.", category:"endgame", level:"advanced", estimatedMinutes:40, progress:0, completed:false, exerciseCount:12 },
  { id:"training-09", title:"Rupturas de peões", description:"Identifique quando abrir o centro ou uma ala.", category:"strategy", level:"intermediate", estimatedMinutes:30, progress:30, completed:false, exerciseCount:9 },
  { id:"training-10", title:"Repertório contra 1.d4", description:"Revise ideias essenciais da Defesa Eslava.", category:"opening", level:"intermediate", estimatedMinutes:30, progress:50, completed:false, exerciseCount:11 },
];
