import { WINNING_SCORE } from '../constants.js'

export function evaluateVictory(gameState) {
    let winners = []
    for (const [playerId, score] of Object.entries(gameState.scores)) {
        if (score >= WINNING_SCORE) {
            winners.push(playerId)
        }
    }

    if(winners.length == 1) return winners
    if(winners.length == 0) return []

    // Tri des scores pour départager les gagnants
    winners.sort((a, b) => gameState.scores[b] - gameState.scores[a])

    let finalWinners = []

    for (const winnerId of winners) {
        if (gameState.scores[winnerId] === gameState.scores[winners[0]]) {
            finalWinners.push(winnerId)
        } else {
            break
        }
    }

    return finalWinners

}
