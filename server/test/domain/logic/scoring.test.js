import { describe, it, expect } from 'vitest'
import { computeRoundScore, updateCumulativeScores } from '../../../src/domain/logic/scoring.js'
import { CardType, ModifierKind, FLIP_SEVEN_BONUS } from '../../../src/domain/constants.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayerState(playerId, overrides = {}) {
    return {
        playerId,
        cards: [],
        hasBusted: false,
        hasFlipSeven: false,
        roundScore: 0,
        ...overrides,
    }
}

function makeNumberCard(value) {
    return { id: `num-${value}-${crypto.randomUUID()}`, type: CardType.NUMBER, value }
}

function makeModifierCard(modifier) {
    return { id: `mod-${modifier}`, type: CardType.MODIFIER, value: modifier }
}

function makeGameState(scores) {
    return { scores }
}

// ─── computeRoundScore ────────────────────────────────────────────────────────

describe('computeRoundScore', () => {

    describe('bust', () => {
        it('force le score à 0 si le joueur a busté', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(12), makeNumberCard(11)],
                hasBusted: true,
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(0)
        })
    })

    describe('somme des cartes numérotées', () => {
        it('retourne 0 avec une main vide', () => {
            const playerState = makePlayerState()

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(0)
        })

        it('additionne correctement plusieurs cartes numérotées', () => {
            const playerState = makePlayerState(undefined,{
                cards: [makeNumberCard(3), makeNumberCard(7), makeNumberCard(10)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(20)
        })

        it('inclut la carte 0 dans la somme sans l\'augmenter', () => {
            const playerState = makePlayerState(undefined,{
                cards: [makeNumberCard(0), makeNumberCard(5)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(5)
        })
    })

    describe('modificateurs additifs', () => {
        it('ajoute +2 à la somme', () => {
            const playerState = makePlayerState(undefined,{
                cards: [makeNumberCard(10), makeModifierCard(ModifierKind.PLUS2)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(12)
        })

        it('ajoute +10 à la somme', () => {
            const playerState = makePlayerState(undefined,{
                cards: [makeNumberCard(10), makeModifierCard(ModifierKind.PLUS10)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(20)
        })

        it('cumule plusieurs modificateurs additifs', () => {
            const playerState = makePlayerState(undefined, {
                cards: [
                    makeNumberCard(5),
                    makeModifierCard(ModifierKind.PLUS2),
                    makeModifierCard(ModifierKind.PLUS4),
                ],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(11)
        })
    })

    describe('modificateur x2', () => {
        it('double la somme des cartes numérotées', () => {
            const playerState = makePlayerState( undefined,{
                cards: [makeNumberCard(5), makeModifierCard(ModifierKind.X2)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(10)
        })

        it('applique le x2 après les modificateurs additifs', () => {
            const playerState = makePlayerState(undefined,{
                cards: [
                    makeNumberCard(5),
                    makeModifierCard(ModifierKind.PLUS4),
                    makeModifierCard(ModifierKind.X2),
                ],
            })

            computeRoundScore(playerState)

            // (5 + 4) × 2 = 18
            expect(playerState.roundScore).toBe(18)
        })
    })

    describe('bonus Flip 7', () => {
        it('ajoute le bonus Flip 7 après le x2', () => {
            const playerState = makePlayerState(undefined,{
                cards: [makeNumberCard(10), makeModifierCard(ModifierKind.X2)],
                hasFlipSeven: true,
            })

            computeRoundScore(playerState)

            // (10 × 2) + 15 = 35
            expect(playerState.roundScore).toBe(10 * 2 + FLIP_SEVEN_BONUS)
        })

        it('ajoute le bonus Flip 7 sans x2', () => {
            const playerState = makePlayerState(undefined, {
                cards: [makeNumberCard(10)],
                hasFlipSeven: true,
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(10 + FLIP_SEVEN_BONUS)
        })
    })
})

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
