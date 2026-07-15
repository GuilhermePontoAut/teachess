import { z } from "zod";

// Hipótese técnica inicial: o schema controla a forma da saída, não sua veracidade factual.
export const provisionalTeacherResponseSchema = z
  .object({
    summary: z.string(),
    observations: z.array(z.string()),
    strengths: z.array(z.string()),
    improvements: z.array(z.string()),
    studyRecommendations: z.array(z.string()),
    evidenceUsed: z.array(z.string()),
    limitations: z.array(z.string()),
    evidenceStatus: z.enum(["sufficient", "partial", "insufficient"]),
  })
  .strict();

export type ProvisionalTeacherResponse = z.infer<typeof provisionalTeacherResponseSchema>;
