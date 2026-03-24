import { describe, it, expect } from 'vitest'
import { updateCumulativeScores } from '../../../src/domain/logic/roundScoring.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayerState(playerId, overrides = {}) {
    return {
        playerId,
        hasBusted: false,
        roundScore: 0,
        ...overrides,
    }
}

function makeGameState(scores) {
    return { scores }
}

// ─── updateCumulativeScores ───────────────────────────────────────────────────

describe('updateCumulativeScores', () => {

    it('additionne le roundScore au score cumulé du joueur', () => {
        const playerState = makePlayerState('p1', { roundScore: 42 })
        const gameState   = makeGameState({ p1: 100 })

        updateCumulativeScores(playerState, gameState)

        expect(gameState.scores['p1']).toBe(142)
    })

    it('part de 0 si le joueur n\'a pas encore de score cumulé', () => {
        const playerState = makePlayerState('p1', { roundScore: 55 })
        const gameState   = makeGameState({ p1: 0 })

        updateCumulativeScores(playerState, gameState)

        expect(gameState.scores['p1']).toBe(55)
    })

    it('ne modifie pas le score si le joueur a busté', () => {
        const playerState = makePlayerState('p1', { roundScore: 0, hasBusted: true })
        const gameState   = makeGameState({ p1: 80 })

        updateCumulativeScores(playerState, gameState)

        expect(gameState.scores['p1']).toBe(80)
    })

    it('ne modifie pas les scores des autres joueurs', () => {
        const playerState = makePlayerState('p1', { roundScore: 30 })
        const gameState   = makeGameState({ p1: 50, p2: 120 })

        updateCumulativeScores(playerState, gameState)

        expect(gameState.scores['p2']).toBe(120)
    })
})
