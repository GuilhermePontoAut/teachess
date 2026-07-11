import type { ChessGame, ExternalGame, PlatformGame, User } from "@/lib/types/chess";

export const isPlatformGame = (game: ChessGame): game is PlatformGame => game.origin === "platform";
export const isExternalGame = (game: ChessGame): game is ExternalGame => game.origin === "external";
export const countsForOfficialStats = isPlatformGame;
export const countsForRanking = isPlatformGame;

export const canViewGame = (user: User, game: ChessGame): boolean =>
  user.role === "admin" || game.visibility === "public" || game.ownerUserId === user.id;

export const canEditGameNotes = (user: User, game: ChessGame): boolean =>
  user.role === "admin" || (isPlatformGame(game) && game.ownerUserId === user.id);

export const canEditGameDetails = (user: User, game: ChessGame): boolean =>
  user.role === "admin" || (isExternalGame(game) && game.addedManually && game.ownerUserId === user.id);

export const canDeleteGame = (user: User, game: ChessGame): boolean =>
  user.role === "admin" || (isExternalGame(game) && game.addedManually && game.ownerUserId === user.id);

// Estas regras orientam apenas o protótipo. Uma aplicação real deve repeti-las e
// validá-las no backend; ocultar controles no cliente não constitui segurança.
