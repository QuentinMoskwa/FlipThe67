import { getGame } from "./gameStorage.js";

export function broadcastGameState(io, gameId) {
  const game = getGame(gameId);
  if (game) io.to(gameId).emit("game-state-update", game);
}
