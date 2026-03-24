import {FLIP_SEVEN_BONUS } from '../constants.js'

/**
 * Calcule le score de manche d'un joueur.
 *
 * Ordre d'application :
 *  1. Somme des cartes numérotées
 *  2. Bonus Flip 7 (+15)
 *  3. Modificateurs additifs (+2 … +10)
 *  4. Modificateur ×2 — appliqué en dernier
 *
 * @param {PlayerRoundState} playerState
 * @returns {number}
 */
export function updateCumulativeScores(playerState, gameState) {
    if (playerState.hasBusted) return 0

    const playerId = playerState.playerId   

    let playerTotalScoreBeforeTurnCompute = gameState.scores[playerId] ?? 0 

    let score = playerState.roundScore + playerTotalScoreBeforeTurnCompute
    
    if (playerState.hasFlipSeven) score += FLIP_SEVEN_BONUS

    // update score of gameState.scores[playerId]
    gameState.scores[playerId] = score
}
