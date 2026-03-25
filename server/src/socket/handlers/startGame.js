import { createRound } from "../../domain/factories.js";
import { createDeck } from "../../domain/deck.js";
import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";
import { GameStatus, RoundPhase } from "../../domain/constants.js";

export function handleStartGame(io, socket) {
  socket.on("start-game", ({ gameId }) => {
    const game = getGame(gameId);

    if (!game) return socket.emit("error", { message: "Partie introuvable." });
    if (game.hostId !== socket.data.playerId)
      return socket.emit("error", { message: "Seul le host peut démarrer." });
    if (game.players.length < 2)
      return socket.emit("error", {
        message: "Minimum 2 joueurs pour démarrer.",
      });
    if (game.status !== GameStatus.WAITING)
      return socket.emit("error", { message: "La partie a déjà commencé." });

    game.status = GameStatus.PLAYING;
    game.round = createRound(game.players, createDeck(), 0);
    game.round.phase = RoundPhase.DEALING;

    broadcastGameState(io, gameId);
    console.log(
      `[start-game] game ${gameId} started with ${game.players.length} players`,
    );
  });
}
