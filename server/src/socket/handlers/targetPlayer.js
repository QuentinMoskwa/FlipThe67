import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";
import { resolveActionCard } from "../../domain/logic/action.js";
import { computeRoundScore } from "../../domain/logic/scoring.js";
import { isRoundOver } from "../../domain/utils/utils.js";
import { advanceToNextPlayer } from "../../domain/game/gameEngine.js";
import { handleRoundEnd } from "./playerAction.js";

export function handleTargetPlayer(io, socket) {
    socket.on("target-player", ({ gameId, targetPlayerId }) => {
        const game = getGame(gameId);
        if (!game)
            return socket.emit("error", { message: "Partie introuvable." });

        const round = game.round;
        const playerId = socket.data.playerId;

        if (!round.pendingAction)
        return socket.emit("error", { message: "Aucune action en attente." });
        if (round.pendingAction.sourcePlayerId !== playerId)
        return socket.emit("error", { message: "Ce n'est pas ton action." });

        if (!round.activePlayerIds.includes(targetPlayerId)) {
            return socket.emit("error", { message: "Cible invalide." });
        }

        const { card, sourcePlayerId } = round.pendingAction;
        round.pendingAction = null;

        resolveActionCard(round, card, sourcePlayerId, targetPlayerId);

        // Recalcule les scores des joueurs passés en stayed par Freeze
        for (const playerState of Object.values(round.playerStates)) {
        if (playerState.hasStayed && !playerState.hasBusted) {
            computeRoundScore(playerState);
        }
        }

        if (isRoundOver(round)) {
        handleRoundEnd(io, gameId, game);
        return;
        }

        advanceToNextPlayer(round, game.players);
        broadcastGameState(io, gameId);
    });
}
