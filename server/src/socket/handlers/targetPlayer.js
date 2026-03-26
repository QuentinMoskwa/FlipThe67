import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";
import { resolveActionCard } from "../../domain/logic/action.js";
import { computeRoundScore } from "../../domain/logic/scoring.js";
import { isRoundOver } from "../../domain/utils/utils.js";
import {
  advanceToNextPlayer,
} from "../../domain/game/gameEngine.js";
import { handleRoundEnd } from "./playerAction.js";

export function handleTargetPlayer(io, socket) {
    socket.on("target-player", ({ gameId, targetPlayerId }) => {
        const game = getGame(gameId);

        const round = game.round;
        const playerId = socket.data.playerId;

        if (!round.pendingAction)
        return socket.emit("error", { message: "Aucune action en attente." });
        if (round.pendingAction.sourcePlayerId !== playerId)
        return socket.emit("error", { message: "Ce n'est pas ton action." });

        // Vérifie que la cible est valide
        const validTargets = round.activePlayerIds.filter((id) => id !== playerId);
        const effectiveTarget = validTargets.length > 0 ? targetPlayerId : playerId;

        if (
        validTargets.length > 0 &&
        !round.activePlayerIds.includes(targetPlayerId)
        )
        return socket.emit("error", { message: "Cible invalide." });

        // Résout l'action avec la cible choisie
        const { card, sourcePlayerId } = round.pendingAction;
        round.pendingAction = null;

        resolveActionCard(round, card, sourcePlayerId, effectiveTarget);

        // Recalcule les scores des joueurs gelés
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
