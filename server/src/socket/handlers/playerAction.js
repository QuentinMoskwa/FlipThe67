import { getGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";
import { GameStatus, RoundPhase } from "../../domain/constants.js";
import {
  processSlay,
  processStay,
  advanceToNextPlayer,
  runDealingPhase,
  finalizeRound,
  closeRound,
} from "../../domain/game/gameEngine.js";

export function handleRoundEnd(io, gameId, game) {
  const { gameOver, winners } = closeRound(game);

  if (gameOver) {
    broadcastGameState(io, gameId);
    io.to(gameId).emit("game-over", { winners });
    return;
  }

  const { roundOver: dealRoundOver } = runDealingPhase(game);
  if (dealRoundOver) {
    finalizeRound(game.round, game);
    closeRound(game);
  }

  broadcastGameState(io, gameId);
}

export function handlePlayerAction(io, socket) {
  socket.on("player-action", ({ gameId, action }) => {
    const game = getGame(gameId);

    if (!game) return socket.emit("error", { message: "Partie introuvable." });
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

    if (action === "slay") {
      const { roundOver, flipSeven, needsTarget, card } = processSlay(
        round,
        playerId,
      );

      // Carte action nécessitant une cible donc on suspend et on demande au client de choisir une cible
      if (needsTarget) {
        const availableTargets = round.activePlayerIds.length > 0 ? targets : [playerId];

        // Broadcast pour que tout le monde voie la carte piochée
        broadcastGameState(io, gameId);

        // Demande de cible uniquement au joueur qui a pioché
        socket.emit("action-requires-target", {
          card,
          availableTargets: availableTargets.map((id) => ({
            id,
            name: game.players.find((p) => p.id === id)?.name,
          })),
        });
        return;
      }

      if (roundOver) {
        finalizeRound(round, game);
        handleRoundEnd(io, gameId, game);
        return;
      }

      advanceToNextPlayer(round, game.players);
      broadcastGameState(io, gameId);
      return;
    }

    // ── Stay ───────────────────────────────────────────────
    if (action === "stay") {
      const { roundOver } = processStay(round, playerId);

      if (roundOver) {
        finalizeRound(round, game);
        handleRoundEnd(io, gameId, game);
        return;
      }

      advanceToNextPlayer(round, game.players);
      broadcastGameState(io, gameId);
      return;
    }

    socket.emit("error", { message: `Action inconnue : ${action}` });
  });
}
