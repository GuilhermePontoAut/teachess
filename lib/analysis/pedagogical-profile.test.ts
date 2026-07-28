import assert from "node:assert/strict";
import test from "node:test";
import {
  derivePedagogicalProfile,
  PEDAGOGICAL_RATING_THRESHOLDS,
} from "./pedagogical-profile";

test("rating ausente ou inválido resulta em iniciante desconhecido", () => {
  assert.deepEqual(derivePedagogicalProfile({ rating: null }), {
    rating: null,
    ratingStatus: "unknown",
    level: "beginner",
  });
  assert.equal(derivePedagogicalProfile({ rating: Number.NaN }).level, "beginner");
});

test("limites estabelecidos são inclusivos e centralizados", () => {
  const games = PEDAGOGICAL_RATING_THRESHOLDS.establishedRatedGames;
  assert.equal(
    derivePedagogicalProfile({
      rating: PEDAGOGICAL_RATING_THRESHOLDS.intermediate - 1,
      ratedGames: games,
    }).level,
    "beginner",
  );
  assert.equal(
    derivePedagogicalProfile({
      rating: PEDAGOGICAL_RATING_THRESHOLDS.intermediate,
      ratedGames: games,
    }).level,
    "intermediate",
  );
  assert.equal(
    derivePedagogicalProfile({
      rating: PEDAGOGICAL_RATING_THRESHOLDS.advanced,
      ratedGames: games,
    }).level,
    "advanced",
  );
});

test("rating provisório usa escolha conservadora", () => {
  const profile = derivePedagogicalProfile({
    rating: PEDAGOGICAL_RATING_THRESHOLDS.advanced + 300,
    ratedGames: PEDAGOGICAL_RATING_THRESHOLDS.establishedRatedGames - 1,
  });
  assert.equal(profile.ratingStatus, "provisional");
  assert.equal(profile.level, "intermediate");
});
