export type PedagogicalLevel = "beginner" | "intermediate" | "advanced";

export type PedagogicalProfile = {
  rating: number | null;
  ratedGames?: number;
  ratingStatus: "unknown" | "provisional" | "established";
  level: PedagogicalLevel;
};

/**
 * Limites iniciais e provisórios. Eles não representam uma classificação
 * universal do xadrez e deverão ser calibrados com a distribuição real dos
 * ratings do TeaChess.
 */
export const PEDAGOGICAL_RATING_THRESHOLDS = {
  intermediate: 1200,
  advanced: 1800,
  establishedRatedGames: 20,
} as const;

type PedagogicalProfileInput = {
  rating: number | null | undefined;
  ratedGames?: number;
};

export function derivePedagogicalProfile({
  rating,
  ratedGames,
}: PedagogicalProfileInput): PedagogicalProfile {
  const normalizedRating =
    typeof rating === "number" && Number.isFinite(rating) && rating >= 0
      ? rating
      : null;
  const normalizedGames =
    typeof ratedGames === "number" && Number.isFinite(ratedGames)
      ? Math.max(0, Math.floor(ratedGames))
      : undefined;
  const ratingStatus =
    normalizedRating === null
      ? "unknown"
      : normalizedGames === undefined ||
          normalizedGames < PEDAGOGICAL_RATING_THRESHOLDS.establishedRatedGames
        ? "provisional"
        : "established";

  let level: PedagogicalLevel = "beginner";
  if (ratingStatus === "established" && normalizedRating !== null) {
    if (normalizedRating >= PEDAGOGICAL_RATING_THRESHOLDS.advanced) {
      level = "advanced";
    } else if (
      normalizedRating >= PEDAGOGICAL_RATING_THRESHOLDS.intermediate
    ) {
      level = "intermediate";
    }
  } else if (
    ratingStatus === "provisional" &&
    normalizedRating !== null &&
    normalizedRating >= PEDAGOGICAL_RATING_THRESHOLDS.advanced
  ) {
    // Escolha conservadora: um rating provisório nunca começa como avançado.
    level = "intermediate";
  }

  return {
    rating: normalizedRating,
    ...(normalizedGames === undefined ? {} : { ratedGames: normalizedGames }),
    ratingStatus,
    level,
  };
}
