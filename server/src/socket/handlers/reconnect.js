import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";

/**
 * Handler pour la reconnexion d'un joueur
 * Vérifie simplement si le joueur existe dans game.players
 */
export function handlePlayerReconnect(io, socket) {
  socket.on("player-reconnect", ({ gameId, playerId }) => {
    const game = getGame(gameId);

    if (!game) {
      return socket.emit("reconnect-failed", {
        message: "Partie introuvable.",
      });
    }

    // Vérifier que le joueur existe dans la partie
    const player = game.players.find((p) => p.id === playerId);
    if (!player) {
      return socket.emit("reconnect-failed", {
        message: "Joueur introuvable dans cette partie.",
      });
    }

    player.socketId = socket.id;

    socket.join(gameId);
    socket.data.gameId = gameId;
    socket.data.playerId = playerId;

    // Confirmer la reconnexion au client
    socket.emit("reconnect-success", { gameId, playerId });

    // Envoyer le gameState complet au joueur qui revient
    // (les autres joueurs reçoivent aussi le broadcast pour voir qu'il est revenu)
    broadcastGameState(io, gameId);

    console.log(`[reconnect] Player ${playerId} reconnected to game ${gameId}`);
  });
}
