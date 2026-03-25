import { describe, it, expect } from 'vitest'
import { evaluateVictory } from '../../../src/domain/logic/victory.js'
import { WINNING_SCORE } from '../../../src/domain/constants.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGameState(scores) {
    return { scores }
}

// ─── evaluateVictory ──────────────────────────────────────────────────────────

describe('evaluateVictory', () => {

    describe('pas de gagnant', () => {
        it('retourne [] si aucun joueur n\'a atteint 200 pts', () => {
            const gameState = makeGameState({ p1: 150, p2: 80 })

            expect(evaluateVictory(gameState)).toEqual([])
        })

        it('retourne [] avec tous les joueurs à 0', () => {
            const gameState = makeGameState({ p1: 0, p2: 0 })

            expect(evaluateVictory(gameState)).toEqual([])
        })

        it('retourne [] avec un score à 199', () => {
            const gameState = makeGameState({ p1: 199 })

            expect(evaluateVictory(gameState)).toEqual([])
        })
    })

    describe('gagnant unique', () => {
        it('retourne le joueur qui atteint exactement 200 pts', () => {
            const gameState = makeGameState({ p1: WINNING_SCORE, p2: 150 })

            expect(evaluateVictory(gameState)).toEqual(['p1'])
        })

        it('retourne le joueur avec le score le plus élevé au-dessus de 200', () => {
            const gameState = makeGameState({ p1: 240, p2: 210 })

            expect(evaluateVictory(gameState)).toEqual(['p1'])
        })

        it('retourne un tableau à un élément, pas une string', () => {
            const gameState = makeGameState({ p1: 200, p2: 50 })
            const result = evaluateVictory(gameState)

            expect(Array.isArray(result)).toBe(true)
            expect(result).toHaveLength(1)
        })
    })

    describe('égalité - manche supplémentaire requise', () => {
        it('retourne les deux joueurs à égalité au-dessus de 200', () => {
            const gameState = makeGameState({ p1: 210, p2: 210 })
            const result = evaluateVictory(gameState)

            expect(result).toHaveLength(2)
            expect(result).toContain('p1')
            expect(result).toContain('p2')
        })

        it('ne retourne que les joueurs à égalité, pas ceux en dessous', () => {
            const gameState = makeGameState({ p1: 220, p2: 220, p3: 200 })
            const result = evaluateVictory(gameState)

            expect(result).toHaveLength(2)
            expect(result).toContain('p1')
            expect(result).toContain('p2')
            expect(result).not.toContain('p3')
        })

        it('gère une égalité à 3 joueurs', () => {
            const gameState = makeGameState({ p1: 210, p2: 210, p3: 210 })
            const result = evaluateVictory(gameState)

            expect(result).toHaveLength(3)
        })
    })
})
