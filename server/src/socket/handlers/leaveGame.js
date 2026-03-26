import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";
import { GameStatus } from "../../domain/constants.js";

/**
 * Handler pour quitter une partie
 * - Retire le joueur de la liste des joueurs
 * - Nettoie les données associées (scores, playerStates, etc.)
 * - Élit un nouveau host si le host a quitté
 * - Broadcast le nouvel état
 */
export function handleLeaveGame(io, socket) {
  socket.on("leave-game", ({ gameId }) => {
    const game = getGame(gameId);
    const playerId = socket.data.playerId;

    if (!game) {
      return socket.emit("error", { message: "Partie introuvable." });
    }

    // Vérifier que le joueur est dans la partie
    const playerIndex = game.players.findIndex(p => p.id === playerId);

    // Retirer le joueur
    game.players.splice(playerIndex, 1);
    delete game.scores[playerId];
    delete game.round?.playerStates[playerId];

    // Si le joueur était le host, élire un nouveau host
    if (game.hostId === playerId) {
      if (game.players.length > 0) {
        const newHostId = game.players[0].id;
        game.hostId = newHostId;
        console.log(
          `[leave-game] Player ${playerId} was host. New host: ${newHostId}`,
        );
      } else {
        // Plus de joueurs, la partie est vide
        game.hostId = null;
        console.log(
          `[leave-game] Player ${playerId} was the last player. Game is now empty.`,
        );
      }
    }

    // Si la partie a commencé et qu'il n'y a plus de joueurs, la terminer
    if (game.status !== GameStatus.WAITING && game.players.length === 0) {
      game.status = GameStatus.FINISHED;
      console.log(`[leave-game] Game ${gameId} finished (no more players)`);
    }

    // Notifier le joueur
    socket.emit("left-game", { success: true });
    socket.leave(gameId);

    // Notifier les autres joueurs
    broadcastGameState(io, gameId);

    console.log(`[leave-game] Player ${playerId} left game ${gameId}`);
  });
}
