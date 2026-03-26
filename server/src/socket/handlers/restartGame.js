import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";
import { GameStatus, RoundPhase } from "../../domain/constants.js";
import { createRound } from "../../domain/factories.js";
import { createDeck } from "../../domain/deck.js";

export function handleRestartGame(io, socket) {
    socket.on("restart-game", ({ gameId }) => {
        const game = getGame(gameId);

        if (!game)
            return socket.emit("error", { message: "Partie introuvable." });
        if (game.hostId !== socket.data.playerId)
            return socket.emit("error", { message: "Seul le host peut relancer une partie." });
        if (game.status !== GameStatus.FINISHED)
            return socket.emit("error", { message: "La partie n'est pas terminée." });

        // Réinitialise les scores en conservant les joueurs et la room
        for (const playerId of Object.keys(game.scores)) {
            game.scores[playerId] = 0
        }

        game.status = GameStatus.PLAYING
        game.dealerIndex = 0
        game.round = createRound(game.players, createDeck(), 0)
        game.round.phase = RoundPhase.PLAYING

        broadcastGameState(io, gameId)
        console.log(`[restart-game] game ${gameId} restarted with ${game.players.length} players`)
    });
}