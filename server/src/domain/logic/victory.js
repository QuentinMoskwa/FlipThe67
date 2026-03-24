import { WINNING_SCORE } from '../constants.js'

// export function evaluateVictory(gameState) {
//     let winners = []
//     for (const [playerId, score] of Object.entries(gameState.scores)) {
//         if (score >= WINNING_SCORE) {
//             winners.push(playerId)
//         }
//     }
//
//     if(winners.length == 1) return winners[0]
//     if(winners.length == 0) return null
//
//     // Tri des scores pour départager les gagnants
//     winners.sort((a, b) => gameState.scores[b] - gameState.scores[a])
//
//     let finalWinners = []
//
//     for (const winnerId of winners) {
//         if (gameState.scores[winnerId] === gameState.scores[winners[0]]) {
//             finalWinners.push(winnerId)
//         } else {
//             break
//         }
//     }
//
//     return finalWinners
//
// }

/**
 * Évalue l'état de victoire à la fin d'un round.
 *
 * Retourne toujours un tableau :
 *   - [] → personne n'a atteint 200 pts, la partie continue
 *   - [id] → un seul gagnant
 *   - [id1, id2] → égalité
 *
 * @param {GameState} gameState
 * @returns {string[]}
 */
export function evaluateVictory(gameState) {
    const qualified = Object.entries(gameState.scores)
        .filter(([, score]) => score >= WINNING_SCORE)
        .map(([playerId]) => playerId)

    if (qualified.length === 0) return []

    const topScore = Math.max(...qualified.map(id => gameState.scores[id]))

    return qualified.filter(id => gameState.scores[id] === topScore)
}

