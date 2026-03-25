import { createPlayer, createGameState } from "../../domain/factories.js";
import { setGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";

export function handleCreateGame(io, socket) {
  socket.on("create-game", ({ playerName }) => {
    const host = createPlayer(playerName, socket.id);
    const game = createGameState([host]);
    game.hostId = host.id;

    setGame(game.id, game);
    socket.join(game.id);
    socket.data.gameId = game.id;
    socket.data.playerId = host.id;

    socket.emit("game-created", { gameId: game.id, playerId: host.id });
    broadcastGameState(io, game.id);

    console.log(`[create-game] ${playerName} created game ${game.id}`);
  });
}
