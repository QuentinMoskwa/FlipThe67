import { createPlayer } from "../../domain/factories.js";
import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";
import { GameStatus } from "../../domain/constants.js";

export function handleJoinGame(io, socket) {
  socket.on("join-game", ({ gameId, playerName }) => {
    const game = getGame(gameId);
    console.log(`[join-game] ${playerName} is trying to join game ${gameId}`);


    if (!game) return socket.emit("error", { message: "Partie introuvable." });
    
    if (game.status !== GameStatus.WAITING)
      return socket.emit("error", { message: "La partie a déjà commencé." });
    if (game.players.some((p) => p.name === playerName))
      return socket.emit("error", {
        message: "Ce pseudo est déjà pris dans cette partie.",
      });

    const player = createPlayer(playerName, socket.id);
    game.players.push(player);
    game.scores[player.id] = 0;

    socket.join(gameId);
    socket.data.gameId = gameId;
    socket.data.playerId = player.id;

    socket.emit("game-joined", { playerId: player.id });

    broadcastGameState(io, gameId);

    console.log(`[join-game] ${playerName} joined game ${gameId}`);
  });
}
