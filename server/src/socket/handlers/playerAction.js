import {getGame} from "../utils/gameStorage.js";
import {broadcastGameState} from "../utils/broadcast.js";
import {GameStatus, RoundPhase} from "../../domain/constants.js";
import {
    processSlay,
    processStay,
    advanceToNextPlayer,
    finalizeRound,
    closeRound,
} from "../../domain/game/gameEngine.js";

// ─── Fin de round ──────────────────────────────────────────────
export function handleRoundEnd(io, gameId, game) {
    finalizeRound(game.round, game);
    broadcastGameState(io, gameId);
}

export function handleNextRound(io, socket) {
    socket.on("next-round", ({gameId}) => {
        const game = getGame(gameId);
        if (!game) return socket.emit("error", {message: "Partie introuvable."});
        if (game.hostId !== socket.data.playerId)
            return socket.emit("error", {message: "Seul le host peut lancer la manche suivante."});

        const {gameOver, winners} = closeRound(game);

        if (gameOver) {
            broadcastGameState(io, gameId);
            io.to(gameId).emit("game-finished", {winners});
            return;
        }

        game.round.phase = RoundPhase.PLAYING;
        broadcastGameState(io, gameId);
    });
}

// ─── Action joueur (slay / stay) ──────────────────────────────
export function handlePlayerAction(io, socket) {
    socket.on("player-action", ({gameId, action}) => {
        const game = getGame(gameId);

        if (!game) return socket.emit("error", {message: "Partie introuvable."});
        if (game.status !== GameStatus.PLAYING)
            return socket.emit("error", {message: "La partie n'est pas en cours."});

        const round = game.round;
        const playerId = socket.data.playerId;

        if (round.phase !== RoundPhase.PLAYING)
            return socket.emit("error", {message: "Ce n'est pas la phase de jeu."});
        if (round.pendingAction)
            return socket.emit("error", {message: "Une action est en attente de cible."});

        const currentPlayerId = game.players[round.currentPlayerIndex].id;
        if (currentPlayerId !== playerId)
            return socket.emit("error", {message: "Ce n'est pas ton tour."});

        const playerState = round.playerStates[playerId];
        if (!playerState)
            return socket.emit("error", {message: "Joueur introuvable."});
        if (playerState.hasBusted || playerState.hasStayed)
            return socket.emit("error", {message: "Tu ne peux plus jouer ce round."});

        if (action === "slay") {
            const {roundOver, needsTarget, card} = processSlay(round, playerId);

            // Carte action nécessitant une cible : on suspend et on demande au client
            if (needsTarget) {
                const availableTargets = round.activePlayerIds
                    .filter(id => id !== playerId)
                    .map(id => ({id, name: game.players.find(p => p.id === id)?.name}));

                const effectiveTargets = availableTargets.length > 0
                    ? availableTargets
                    : [{id: playerId, name: game.players.find(p => p.id === playerId)?.name}];

                broadcastGameState(io, gameId);
                socket.emit("action-requires-target", {card, availableTargets: effectiveTargets});
                return;
            }

            if (roundOver) {
                handleRoundEnd(io, gameId, game);
                return;
            }

            advanceToNextPlayer(round, game.players);
            broadcastGameState(io, gameId);
            return;
        }

        if (action === "stay") {
            const {roundOver} = processStay(round, playerId);

            if (roundOver) {
                handleRoundEnd(io, gameId, game);
                return;
            }

            advanceToNextPlayer(round, game.players);
            broadcastGameState(io, gameId);
            return;
        }

        socket.emit("error", {message: `Action inconnue : ${action}`});
    });
}
