/**
 * @fileoverview Moteur de jeu FlipThe67.
 *
 * Orchestre les actions des joueurs pendant la phase Playing.
 * Ce fichier est le point d'entrée unique pour toute mutation
 * de GameState pendant un round - les handlers Socket.io ne font
 * qu'appeler ces fonctions et diffuser le GameState résultant.
 *
 * Dépendances :
 *   - deck.js → drawCard
 *   - playerState.js → isBust, isFlipSeven
 *   - scoring.js → computeRoundScore, updateCumulativeScores
 *   - actions.js → resolveActionCard
 *   - utils.js → removeFromActive
 */

import {CardType, RoundPhase} from './constants.js'
import {drawCard} from './deck.js'
import {isBust, isFlipSeven} from './logic/playerState.js'
import {computeRoundScore, updateCumulativeScores} from './logic/scoring.js'
import {resolveActionCard} from './logic/action.js'
import {removeFromActive, isRoundOver} from './utils/utils.js'

/**
 * Calcule le score des joueurs ayant un hasStayed = true mais pas de roundScore final.
 * Appelé après resolveActionCard pour couvrir les joueurs gelés par un Freeze.
 * computeRoundScore est idempotent - safe à appeler plusieurs fois.
 *
 * @param {Round} round
 */
export function computeScoreForStayedPlayers(round) {
    for (const playerState of Object.values(round.playerStates)) {
        if (playerState.hasStayed && !playerState.hasBusted) {
            computeRoundScore(playerState)
        }
    }
}

// ─── Actions joueur ───────────────────────────────────────────────────────────

/**
 * Traite l'action "Slay" (Hit) d'un joueur : pioche une carte et résout son effet.
 *
 * Flux :
 *  1. Pioche une carte
 *  2a. ACTION → resolveActionCard (Freeze, FlipThree, SecondChance)
 *      Après résolution, calcule le score des joueurs potentiellement gelés.
 *  2b. NUMBER / MODIFIER → ajoute à la main du joueur
 *      → vérifie isBust → vérifie isFlipSeven → computeRoundScore
 *
 * @param {Round}    round
 * @param {string}   playerId       - Le joueur qui joue
 * @param {string}   [targetPlayerId] - Cible d'une carte Action (défini par le client)
 * @returns {{ roundOver: boolean, flipSeven: boolean }}
 */
export function processSlay(round, playerId, targetPlayerId) {
    const playerState = round.playerStates[playerId]
    const card = drawCard(round.deck)

    if (card.type === CardType.ACTION) {
        resolveActionCard(round, card, playerId, targetPlayerId)
        computeScoreForStayedPlayers(round)
        const flipSeven = Object.values(round.playerStates).some(ps => ps.hasFlipSeven)
        if (flipSeven) round.activePlayerIds = []
        return { roundOver: isRoundOver(round), flipSeven }
    }

    // NUMBER ou MODIFIER
    playerState.cards.push(card)
    isBust(playerState)

    if (playerState.hasBusted) {
        computeRoundScore(playerState)
        removeFromActive(round, playerId)
        return {roundOver: isRoundOver(round), flipSeven: false}
    }

    if (isFlipSeven(playerState.cards)) {
        playerState.hasFlipSeven = true
        computeRoundScore(playerState)
        round.activePlayerIds = []
        return {roundOver: true, flipSeven: true}
    }

    computeRoundScore(playerState)
    return {roundOver: false, flipSeven: false}
}

/**
 * Traite l'action "Stay" d'un joueur : banke ses points et sort du round.
 *
 * @param {Round}    round
 * @param {string}   playerId
 * @returns {{ roundOver: boolean }}
 */
export function processStay(round, playerId) {
    const playerState = round.playerStates[playerId]

    if (playerState.hasBusted || playerState.hasStayed) return {roundOver: isRoundOver(round)}

    computeRoundScore(playerState)
    playerState.hasStayed = true
    removeFromActive(round, playerId)

    return {roundOver: isRoundOver(round)}
}

/**
 * Avance currentPlayerIndex au prochain joueur encore actif.
 * Les joueurs bustés et stayed sont ignorés.
 * À appeler par la collègue en fin de tour dans la phase Playing.
 *
 * @param {Round} round
 * @param {Player[]} players - Liste complète des joueurs de la partie
 */
export function advanceToNextPlayer(round, players) {
    const total = players.length
    let next = (round.currentPlayerIndex + 1) % total

    for (let i = 0; i < total; i++) {
        const playerId = players[next % total].id
        if (round.activePlayerIds.includes(playerId)) {
            round.currentPlayerIndex = next % total
            return
        }
        next++
    }
}

/**
 * Finalise un round terminé : calcule les scores cumulés de tous les joueurs
 * et passe la phase du round à SCORING.
 * À appeler quand isRoundOver() retourne true.
 *
 * @param {Round}    round
 * @param {GameState} gameState
 */
export function finalizeRound(round, gameState) {
    round.phase = RoundPhase.SCORING

    for (const playerState of Object.values(round.playerStates)) {
        updateCumulativeScores(playerState, gameState)
    }
}
