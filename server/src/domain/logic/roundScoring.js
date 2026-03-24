
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

    // update score of gameState.scores[playerId]
    gameState.scores[playerId] = score
}
