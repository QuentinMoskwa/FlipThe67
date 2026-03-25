/**
 * @fileoverview Orchestrateur d'un round complet de Flip 7.
 *
 * Cycle de vie d'un round :
 *   DEALING  → distribution initiale + résolution des ActionCards
 *   PLAYING  → tour par tour, hit / stay (TODO: interaction client)
 *   SCORING  → calcul des scores de manche + cumul
 *   ENDED    → vérification victoire, rotation du dealer, reset des états
 *
 * Convention : toutes les fonctions qui mutent le gameState émettent
 * un event Socket.io 'game:stateUpdate' après leur mutation pour que
 * les clients restent synchronisés.
 */

import { RoundPhase, GameStatus } from '../constants.js'
import { createDeck, drawCard }   from '../deck.js'
import { createRound }            from '../factories.js'
import { resolveActionCard }      from '../logic/action.js'
import { isBust, isFlipSeven }   from '../logic/playerState.js'
import { computeRoundScore, updateCumulativeScores } from '../logic/scoring.js'
import { evaluateVictory }        from '../logic/victory.js'
import { getOrderedPlayers, removeFromActive } from '../utils/utils.js'
import { CardType }               from '../constants.js'

// ─── Helpers d'émission ────────────────────────────────────────────────────────

/**
 * Diffuse l'état complet de la partie à tous les joueurs de la room.
 *
 * @param {Server}    io
 * @param {string}    gameId
 * @param {GameState} gameState
 */
function broadcastState(io, gameId, gameState) {
    io.to(gameId).emit('game:stateUpdate', gameState)
}

// ─── Phase DEALING ─────────────────────────────────────────────────────────────

/**
 * Distribue une carte à chaque joueur dans l'ordre de jeu.
 * Si une ActionCard sort, elle est résolue immédiatement avant de continuer.
 *
 * Règle de ciblage pendant le deal : la carte action est résolue
 * en ciblant le joueur à qui elle aurait été distribuée.
 *
 * @param {GameState} gameState
 * @param {Server}    io
 */
function runDealingPhase(gameState, io) {
    const round = gameState.round
    round.phase = RoundPhase.DEALING
    broadcastState(io, gameState.id, gameState)

    const orderedPlayers = getOrderedPlayers(gameState.players, round.startingPlayerIndex)

    for (const player of orderedPlayers) {
        const playerState = round.playerStates[player.id]

        if (playerState.hasStayed || playerState.hasBusted) continue

        const card = drawCard(round.deck)

        if (card.type === CardType.ACTION) {
            resolveActionCard(round, card, player.id, undefined)
            round.discardPile = round.discardPile ?? []
            round.discardPile.push(card)
        } else {
            playerState.cards.push(card)

            if (playerState.hasBusted) {
                removeFromActive(round, player.id)
            } else if (isFlipSeven(playerState.cards)) {
                playerState.hasFlipSeven = true
                endRoundEarly(gameState, io)
                return
            }
        }

        broadcastState(io, gameState.id, gameState)
    }

    round.phase = RoundPhase.PLAYING
    broadcastState(io, gameState.id, gameState)
}

/**
 * Met fin au round immédiatement (cas Flip 7 pendant le deal ou le playing).
 * Passe directement en phase SCORING.
 *
 * @param {GameState} gameState
 * @param {Server}    io
 */
function endRoundEarly(gameState, io) {
    gameState.round.phase = RoundPhase.SCORING
    broadcastState(io, gameState.id, gameState)
}

// ─── Phase PLAYING ─────────────────────────────────────────────────────────────

/**
 * Gère le tour d'un joueur : enregistre son action (hit ou stay)
 * et met à jour l'état du round en conséquence.
 *
 * Cette fonction est appelée par le handler Socket.io 'game : playerAction'
 * (voir index.js). Elle est intentionnellement synchrone — c'est le handler
 * socket qui porte la logique d'attente asynchrone.
 *
 * @param {GameState} gameState
 * @param {string}    playerId
 * @param {'hit'|'stay'} action
 * @param {string}    [targetPlayerId]  - Requis si la carte piochée est une ActionCard
 * @param {Server}    io
 * @returns {{ roundOver: boolean }}
 */
/*export function applyPlayerAction(gameState, playerId, action, targetPlayerId, io) {
    const round = gameState.round
    const playerState = round.playerStates[playerId]

    if (playerState.hasStayed || playerState.hasBusted) {
        return { roundOver: isRoundOver(round) }
    }

    if (action === 'stay') {
        playerState.hasStayed = true
        removeFromActive(round, playerId)
        broadcastState(io, gameState.id, gameState)
        return { roundOver: isRoundOver(round) }
    }

    const card = drawCard(round.deck)

    if (card.type === CardType.ACTION) {
        resolveActionCard(round, card, playerId, targetPlayerId)
        round.discardPile = round.discardPile ?? []
        round.discardPile.push(card)
    } else {
        playerState.cards.push(card)

        if (isBust(playerState)) {
            removeFromActive(round, playerId)
        } else if (isFlipSeven(playerState.cards)) {
            playerState.hasFlipSeven = true
            endRoundEarly(gameState, io)
            broadcastState(io, gameState.id, gameState)
            return { roundOver: true }
        }
    }

    broadcastState(io, gameState.id, gameState)
    return { roundOver: isRoundOver(round) }
}*/

/**
 * Un round est terminé quand tous les joueurs ont soit busté, soit stay.
 *
 * @param {Round} round
 * @returns {boolean}
 */
function isRoundOver(round) {
    return round.activePlayerIds.length === 0
}

// ─── Phase SCORING ─────────────────────────────────────────────────────────────

/**
 * Calcule les scores de manche et met à jour les scores cumulés
 * pour tous les joueurs.
 *
 * @param {GameState} gameState
 * @param {Server}    io
 */
function runScoringPhase(gameState, io) {
    const round = gameState.round
    round.phase = RoundPhase.SCORING

    for (const playerState of Object.values(round.playerStates)) {
        computeRoundScore(playerState)
        updateCumulativeScores(playerState, gameState)
    }

    broadcastState(io, gameState.id, gameState)
}

// ─── Phase ENDED + transition ──────────────────────────────────────────────────

/**
 * Clôture le round :
 * 1. Vérifie s'il y a un ou des gagnants
 * 2. Si partie terminée → met le status à FINISHED et diffuse
 * 3. Sinon → rotation du dealer et préparation du round suivant
 *
 * @param {GameState} gameState
 * @param {Server}    io
 * @returns {{ gameOver: boolean, winners: string[] }}
 */
function closeRound(gameState, io) {
    const round = gameState.round
    round.phase = RoundPhase.ENDED
    broadcastState(io, gameState.id, gameState)

    const winners = evaluateVictory(gameState)

    if (winners.length > 0) {
        gameState.status = GameStatus.FINISHED
        io.to(gameState.id).emit('game:finished', { winners })
        broadcastState(io, gameState.id, gameState)
        return { gameOver: true, winners }
    }

    const nextStartingIndex =
        (round.startingPlayerIndex + 1) % gameState.players.length

    gameState.round = createRound(gameState.players, createDeck(), nextStartingIndex)

    return { gameOver: false, winners: [] }
}

// ─── Point d'entrée principal ──────────────────────────────────────────────────

/**
 * Lance un round complet.
 * Appelé par le handler 'game:start' dans index.js.
 *
 * Flow :
 *   1. Crée le round si inexistant
 *   2. Phase DEALING
 *   3. Phase PLAYING → TODO: piloté par les events socket
 *   4. Phase SCORING
 *   5. Clôture + rotation
 *
 * @param {GameState} gameState
 * @param {Server}    io
 */
export function startRound(gameState, io) {
    if (!gameState.round) {
        gameState.round = createRound(
            gameState.players,
            createDeck(),
            0
        )
    }

    gameState.status = GameStatus.PLAYING
    broadcastState(io, gameState.id, gameState)

    // ── Phase 1 : DEALING ──
    runDealingPhase(gameState, io)

    // ── Phase 2 : PLAYING ──
    // TODO: Cette phase est pilotée par les events Socket.io entrants.
    // Le handler 'game:playerAction' dans index.js appelle applyPlayerAction()
    // pour chaque action joueur. Quand isRoundOver() → true, appeler runScoringPhase().
    //
    // Exemple de handler à ajouter dans index.js :
    //
    //   socket.on('game:playerAction', ({ gameId, playerId, action, targetPlayerId }) => {
    //     const gameState = games.get(gameId)
    //     const { roundOver } = applyPlayerAction(gameState, playerId, action, targetPlayerId, io)
    //     if (roundOver) {
    //       runScoringAndClose(gameState, io)
    //     }
    //   })
    //
    if (gameState.round.phase === RoundPhase.PLAYING) {
        runScoringAndClose(gameState, io)
    }
    else if (gameState.round.phase === RoundPhase.SCORING) {
        runScoringAndClose(gameState, io)
    }
}

/**
 * Enchaîne scoring + clôture du round.
 * Séparé de startRound pour être appelable depuis le handler socket
 * une fois la phase PLAYING terminée.
 *
 * @param {GameState} gameState
 * @param {Server}    io
 * @returns {{ gameOver: boolean, winners: string[] }}
 */
export function runScoringAndClose(gameState, io) {
    runScoringPhase(gameState, io)
    return closeRound(gameState, io)
}