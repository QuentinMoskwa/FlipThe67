import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";
import { GameStatus } from "../../domain/constants.js";
import { advanceToNextPlayer } from "../../domain/game/gameEngine.js";
import { handleRoundEnd } from "./playerAction.js";
import { isRoundOver } from "../../domain/utils/utils.js";

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
    if (playerIndex === -1)
      return socket.emit("error", { message: "Joueur introuvable dans cette partie." });

    const round        = game.round;
    const wasMyTurn    = round && game.players[round.currentPlayerIndex]?.id === playerId;
    const wasActive    = round?.activePlayerIds?.includes(playerId) ?? false;

    // ── Retirer le joueur de toutes les structures ────────────
    game.players.splice(playerIndex, 1);
    delete game.scores[playerId];

    if (round) {
      delete round.playerStates[playerId];

      // Annuler la pendingAction si ce joueur était impliqué
      if (round.pendingAction?.sourcePlayerId === playerId ||
          round.pendingAction?.targetPlayerId === playerId) {
        round.pendingAction = null;
      }

      // Retirer des actifs
      if (wasActive) {
        round.activePlayerIds = round.activePlayerIds.filter(id => id !== playerId);
      }

      // inférieur ou égal à l'index courant, l'index décale d'un cran.
      if (playerIndex <= round.currentPlayerIndex && round.currentPlayerIndex > 0) {
        round.currentPlayerIndex -= 1;
      }

      if (wasMyTurn && game.players.length > 0 && round.phase === 'playing') {
        if (isRoundOver(round)) {
          handleRoundEnd(io, gameId, game);
        } else {
          advanceToNextPlayer(round, game.players);
        }
      }
    }

    // ── Gestion du host ────────────────────────────────────────
    if (game.hostId === playerId) {
      game.hostId = game.players.length > 0 ? game.players[0].id : null;
      if (game.hostId) {
        console.log(`[leave-game] New host: ${game.hostId}`);
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
