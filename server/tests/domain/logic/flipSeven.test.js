import { describe, it, expect } from 'vitest'
import { isFlipSeven } from '../../../src/domain/logic/flipSeven.js'
import { CardType } from '../../../src/domain/constants.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeNumberCard(value) {
    return { id: `num-${value}-${crypto.randomUUID()}`, type: CardType.NUMBER, value }
}

function makeActionCard(action) {
    return { id: `action-${action}`, type: CardType.ACTION, value: action }
}

function makeModifierCard(modifier) {
    return { id: `mod-${modifier}`, type: CardType.MODIFIER, value: modifier }
}

function makeUniqueNumberCards(count) {
    return Array.from({ length: count }, (_, i) => makeNumberCard(i))
}

// ─── isFlipSeven ──────────────────────────────────────────────────────────────

describe('isFlipSeven', () => {

    describe('cas positifs', () => {
        it('retourne true avec exactement 7 cartes numérotées uniques', () => {
            const hand = makeUniqueNumberCards(7)
            expect(isFlipSeven(hand)).toBe(true)
        })

        it('retourne true avec 7 cartes numérotées et des cartes Action/Modifier ignorées', () => {
            const hand = [
                ...makeUniqueNumberCards(7),
                makeActionCard('freeze'),
                makeModifierCard('+2'),
            ]
            expect(isFlipSeven(hand)).toBe(true)
        })
    })

    describe('cas négatifs', () => {
        it('retourne false avec une main vide', () => {
            expect(isFlipSeven([])).toBe(false)
        })

        it('retourne false avec moins de 7 cartes numérotées', () => {
            expect(isFlipSeven(makeUniqueNumberCards(6))).toBe(false)
        })

        it('retourne false avec plus de 7 cartes numérotées', () => {
            expect(isFlipSeven(makeUniqueNumberCards(8))).toBe(false)
        })

        it('retourne false avec 7 cartes dont certaines ne sont pas numérotées', () => {
            const hand = [
                ...makeUniqueNumberCards(5),
                makeActionCard('freeze'),
                makeModifierCard('+4'),
            ]
            expect(isFlipSeven(hand)).toBe(false)
        })
    })
})
