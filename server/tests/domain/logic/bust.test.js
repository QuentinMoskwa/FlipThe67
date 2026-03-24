import { describe, it, expect, vi } from 'vitest'
import { isBust } from '../../../src/domain/logic/bust.js'
import { CardType } from '../../../src/domain/constants.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayerState(overrides = {}) {
    return {
        cards: [],
        hasBusted: false,
        hasSecondChance: false,
        ...overrides,
    }
}

function makeNumberCard(value) {
    return { id: `num-${value}-${crypto.randomUUID()}`, type: CardType.NUMBER, value }
}

function makeActionCard(action) {
    return { id: `action-${action}`, type: CardType.ACTION, value: action }
}

function makeModifierCard(modifier) {
    return { id: `mod-${modifier}`, type: CardType.MODIFIER, value: modifier }
}

// ─── isBust ───────────────────────────────────────────────────────────────────

describe('isBust', () => {

    describe('pas de bust', () => {
        it('ne bust pas avec une main vide', () => {
            const playerState = makePlayerState()

            isBust(playerState)

            expect(playerState.hasBusted).toBe(false)
        })

        it('ne bust pas avec une seule carte numérotée', () => {
            const playerState = makePlayerState({ cards: [makeNumberCard(5)] })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(false)
        })

        it('ne bust pas avec des cartes numérotées toutes différentes', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(3), makeNumberCard(7), makeNumberCard(11)],
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(false)
        })

        it('ignore les cartes Action et Modifier pour la détection', () => {
            const playerState = makePlayerState({
                cards: [
                    makeNumberCard(4),
                    makeActionCard('freeze'),
                    makeModifierCard('+2'),
                ],
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(false)
        })

        it('ne bust pas si le doublon est sur une carte non numérotée', () => {
            const playerState = makePlayerState({
                cards: [
                    makeActionCard('freeze'),
                    makeActionCard('freeze'),
                    makeNumberCard(4),
                ],
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(false)
        })
    })

    describe('bust simple', () => {
        it('bust avec deux cartes numérotées identiques', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(5), makeNumberCard(5)],
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(true)
        })

        it('bust avec un doublon parmi plusieurs cartes différentes', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(3), makeNumberCard(8), makeNumberCard(3)],
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(true)
        })

        it('bust sur la valeur 0 en doublon', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(0), makeNumberCard(0)],
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(true)
        })

        it('bust sur la valeur 12 en doublon', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(12), makeNumberCard(5), makeNumberCard(12)],
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(true)
        })
    })

    describe('bust avec Second Chance', () => {
        it('consomme le Second Chance et ne bust pas', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(7), makeNumberCard(7)],
                hasSecondChance: true,
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(false)
            expect(playerState.hasSecondChance).toBe(false)
        })

        it('bust quand il y a un doublon mais plus de Second Chance', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(7), makeNumberCard(7)],
                hasSecondChance: false,
            })

            isBust(playerState)

            expect(playerState.hasBusted).toBe(true)
        })

        it('ne consomme pas le Second Chance s\'il n\'y a pas de doublon', () => {
            const playerState = makePlayerState({
                cards: [makeNumberCard(3), makeNumberCard(8)],
                hasSecondChance: true,
            })

            isBust(playerState)

            expect(playerState.hasSecondChance).toBe(true)
            expect(playerState.hasBusted).toBe(false)
        })
    })
})
