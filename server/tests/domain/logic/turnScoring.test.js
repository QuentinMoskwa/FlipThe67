import { describe, it, expect } from 'vitest'
import { computeRoundScore } from '../../../src/domain/logic/turnScoring.js'
import { CardType, ModifierKind, FLIP_SEVEN_BONUS } from '../../../src/domain/constants.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayerState(overrides = {}) {
    return {
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
            const playerState = makePlayerState({
                cards: [makeNumberCard(3), makeNumberCard(7), makeNumberCard(10)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(20)
        })

        it('inclut la carte 0 dans la somme sans l\'augmenter', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(0), makeNumberCard(5)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(5)
        })
    })

    describe('modificateurs additifs', () => {
        it('ajoute +2 à la somme', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(10), makeModifierCard(ModifierKind.PLUS2)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(12)
        })

        it('ajoute +10 à la somme', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(10), makeModifierCard(ModifierKind.PLUS10)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(20)
        })

        it('cumule plusieurs modificateurs additifs', () => {
            const playerState = makePlayerState({
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
            const playerState = makePlayerState({
                cards: [makeNumberCard(5), makeModifierCard(ModifierKind.X2)],
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(10)
        })

        it('applique le x2 après les modificateurs additifs', () => {
            const playerState = makePlayerState({
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
            const playerState = makePlayerState({
                cards: [makeNumberCard(10), makeModifierCard(ModifierKind.X2)],
                hasFlipSeven: true,
            })

            computeRoundScore(playerState)

            // (10 × 2) + 15 = 35
            expect(playerState.roundScore).toBe(10 * 2 + FLIP_SEVEN_BONUS)
        })

        it('ajoute le bonus Flip 7 sans x2', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(10)],
                hasFlipSeven: true,
            })

            computeRoundScore(playerState)

            expect(playerState.roundScore).toBe(10 + FLIP_SEVEN_BONUS)
        })
    })
})
