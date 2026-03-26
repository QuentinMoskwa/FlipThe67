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

// ─── Diffuse la carte piochée à tous les joueurs ───────────────
// Émis AVANT broadcastGameState pour que la carte soit visible
// avant que le gameState soit mis à jour côté client.
function broadcastCardDrawn(io, gameId, game, playerId, card, result) {
    const playerName = game.players.find(p => p.id === playerId)?.name ?? playerId
    io.to(gameId).emit('card-drawn', {playerId, playerName, card, result})
}

// ─── Fin de round ──────────────────────────────────────────────
// S'arrête à SCORING et broadcast → le frontend bascule sur RoundSummary.
// closeRound est appelé dans handleNextRound, déclenché par le host.
export function handleRoundEnd(io, gameId, game) {
  finalizeRound(game.round, game);
  broadcastGameState(io, gameId);
}

// ─── Manche suivante ──────────────────────────────────────────────────────────
export function handleNextRound(io, socket) {
  socket.on("next-round", ({ gameId }) => {
    const game = getGame(gameId);
    if (!game)
      return socket.emit("error", { message: "Partie introuvable." });
    if (game.hostId !== socket.data.playerId)
      return socket.emit("error", {
        message: "Seul le host peut lancer la manche suivante.",
      });

    const { gameOver, winners } = closeRound(game);

    if (gameOver) {
      broadcastGameState(io, gameId);
      io.to(gameId).emit("game-finished", { winners });
      return;
    }

    broadcastGameState(io, gameId);
  });
}

function beforeRoundEnd(roundOver, io, gameId, game, round) {
  if (roundOver) {
    broadcastGameState(io, gameId)
    game.round.phase = RoundPhase.SCORING
    setTimeout(() => {
      handleRoundEnd(io, gameId, game);
    }, 2500)
    return;
  }

  advanceToNextPlayer(round, game.players);
  broadcastGameState(io, gameId);
  return;
}

// ─── Action joueur (slay / stay) ──────────────────────────────────────────────
export function handlePlayerAction(io, socket) {
  socket.on("player-action", ({ gameId, action }) => {
    const game = getGame(gameId);

    if (!game)
      return socket.emit("error", { message: "Partie introuvable." });
    if (game.status !== GameStatus.PLAYING)
      return socket.emit("error", { message: "La partie n'est pas en cours." });

    const round = game.round;
    const playerId = socket.data.playerId;

    if (round.phase !== RoundPhase.PLAYING)
      return socket.emit("error", { message: "Ce n'est pas la phase de jeu." });
    if (round.pendingAction)
      return socket.emit("error", {
        message: "Une action est en attente de cible.",
      });

    const currentPlayerId = game.players[round.currentPlayerIndex].id;
    if (currentPlayerId !== playerId)
      return socket.emit("error", { message: "Ce n'est pas ton tour." });

    const playerState = round.playerStates[playerId];
    if (!playerState)
      return socket.emit("error", { message: "Joueur introuvable." });
    if (playerState.hasBusted || playerState.hasStayed)
      return socket.emit("error", {
        message: "Tu ne peux plus jouer ce round.",
      });

    // ── Slay ────────────────────────────────────────────────────────────────
    if (action === "slay") {
      const { roundOver, needsTarget, card } = processSlay(round, playerId);

            // Déterminer le résultat pour l'animation de révélation côté client
            const pState = round.playerStates[playerId]
            const cardResult = needsTarget
                ? 'action'
                : pState?.hasBusted
                    ? 'bust'
                    : pState?.hasFlipSeven
                        ? 'flipSeven'
                        : 'normal'

            broadcastCardDrawn(io, gameId, game, playerId, card, cardResult)

      if (needsTarget) {
        const actives = round.activePlayerIds
        const effectiveTargets = actives.length > 0 ? actives : [playerId];

        broadcastGameState(io, gameId);
        socket.emit("action-requires-target", {
          card,
          availableTargets: effectiveTargets.map((id) => ({
            id,
            name: game.players.find((p) => p.id === id)?.name,
          })),
        });
        return;
      }

      beforeRoundEnd(roundOver, io, gameId, game, round);
    }

    // ── Stay ────────────────────────────────────────────────────────────────
    if (action === "stay") {
      const { roundOver } = processStay(round, playerId);

      beforeRoundEnd(roundOver, io, gameId, game, round);
    }

    socket.emit("error", { message: `Action inconnue : ${action}` });
  });
}
