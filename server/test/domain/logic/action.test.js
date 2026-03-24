import { describe, it, expect, vi, beforeEach } from 'vitest'
import { applyFreeze, applyFlipThree, applySecondChance, resolveActionCard } from '../../../src/domain/logic/action.js'
import { ActionKind, CardType } from '../../../src/domain/constants.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../src/domain/deck.js', () => ({
    drawCard: vi.fn(),
}))

import { drawCard } from '../../../src/domain/deck.js'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePlayerState(playerId, overrides = {}) {
    return {
        playerId,
        cards: [],
        hasBusted: false,
        hasStayed: false,
        hasFlipSeven: false,
        hasSecondChance: false,
        roundScore: 0,
        ...overrides,
    }
}

function makeRound(playerIds) {
    const playerStates = Object.fromEntries(
        playerIds.map(id => [id, makePlayerState(id)])
    )
    return {
        deck: [],
        discardPile: [],
        activePlayerIds: [...playerIds],
        playerStates,
    }
}

function makeNumberCard(value) {
    return { id: `num-${value}-${Math.random()}`, type: CardType.NUMBER, value }
}

function makeActionCard(action) {
    return { id: `action-${action}`, type: CardType.ACTION, value: action }
}

function makeModifierCard(modifier) {
    return { id: `mod-${modifier}`, type: CardType.MODIFIER, value: modifier }
}

// ─── applyFreeze ──────────────────────────────────────────────────────────────

describe('applyFreeze', () => {
    it('marque le joueur comme stayed et le retire des actifs', () => {
        const round = makeRound(['p1', 'p2'])

        applyFreeze(round, 'p1')

        expect(round.playerStates['p1'].hasStayed).toBe(true)
        expect(round.activePlayerIds).not.toContain('p1')
        expect(round.activePlayerIds).toContain('p2')
    })

    it('ne fait rien si le joueur a déjà busté', () => {
        const round = makeRound(['p1'])
        round.playerStates['p1'].hasBusted = true

        applyFreeze(round, 'p1')

        expect(round.playerStates['p1'].hasStayed).toBe(false)
    })

    it('ne fait rien si le joueur a déjà stayed', () => {
        const round = makeRound(['p1'])
        round.playerStates['p1'].hasStayed = true

        applyFreeze(round, 'p1')

        expect(round.activePlayerIds).toContain('p1')
    })
})

// ─── applySecondChance ────────────────────────────────────────────────────────

describe('applySecondChance', () => {
    it('donne le Second Chance au joueur qui n\'en a pas', () => {
        const playerState = makePlayerState('p1')

        applySecondChance(playerState)

        expect(playerState.hasSecondChance).toBe(true)
    })

    it('ne fait rien si le joueur a déjà un Second Chance', () => {
        const playerState = makePlayerState('p1', { hasSecondChance: true })

        applySecondChance(playerState)

        expect(playerState.hasSecondChance).toBe(true)
    })
})

// ─── applyFlipThree ───────────────────────────────────────────────────────────

describe('applyFlipThree', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('fait piocher exactement 3 cartes au joueur ciblé', () => {
        const round = makeRound(['p1'])
        drawCard
            .mockReturnValueOnce(makeNumberCard(3))
            .mockReturnValueOnce(makeNumberCard(5))
            .mockReturnValueOnce(makeNumberCard(7))
        const resolveAction = vi.fn()

        applyFlipThree(round, 'p1', resolveAction)

        expect(drawCard).toHaveBeenCalledTimes(3)
        expect(round.playerStates['p1'].cards).toHaveLength(3)
    })

    it('ajoute les cartes number et modifier dans le Card[] du joueur', () => {
        const round = makeRound(['p1'])
        const numberCard   = makeNumberCard(4)
        const modifierCard = makeModifierCard('+2')
        const numberCard2  = makeNumberCard(6)
        drawCard
            .mockReturnValueOnce(numberCard)
            .mockReturnValueOnce(modifierCard)
            .mockReturnValueOnce(numberCard2)
        const resolveAction = vi.fn()

        applyFlipThree(round, 'p1', resolveAction)

        expect(round.playerStates['p1'].cards).toContain(numberCard)
        expect(round.playerStates['p1'].cards).toContain(modifierCard)
        expect(round.playerStates['p1'].cards).toContain(numberCard2)
    })

    it('met en attente les Freeze/FlipThree et les résout après les 3 tirages', () => {
        const round = makeRound(['p1', 'p2'])
        const freezeCard = makeActionCard(ActionKind.FREEZE)
        drawCard
            .mockReturnValueOnce(freezeCard)
            .mockReturnValueOnce(makeNumberCard(2))
            .mockReturnValueOnce(makeNumberCard(3))
        const resolveAction = vi.fn()

        applyFlipThree(round, 'p1', resolveAction)

        expect(resolveAction).toHaveBeenCalledTimes(1)
        expect(resolveAction).toHaveBeenCalledWith(round, freezeCard, 'p1')
        expect(round.playerStates['p1'].cards).not.toContain(freezeCard)
    })

    it('donne le Second Chance si le joueur n\'en a pas', () => {
        const round = makeRound(['p1'])
        drawCard
            .mockReturnValueOnce(makeActionCard(ActionKind.SECOND_CHANCE))
            .mockReturnValueOnce(makeNumberCard(2))
            .mockReturnValueOnce(makeNumberCard(3))
        const resolveAction = vi.fn()

        applyFlipThree(round, 'p1', resolveAction)

        expect(round.playerStates['p1'].hasSecondChance).toBe(true)
    })

    it('défausse le Second Chance si le joueur en a déjà un', () => {
        const round = makeRound(['p1'])
        round.playerStates['p1'].hasSecondChance = true
        drawCard
            .mockReturnValueOnce(makeActionCard(ActionKind.SECOND_CHANCE))
            .mockReturnValueOnce(makeNumberCard(2))
            .mockReturnValueOnce(makeNumberCard(3))
        const resolveAction = vi.fn()

        applyFlipThree(round, 'p1', resolveAction)

        expect(round.playerStates['p1'].hasSecondChance).toBe(true)
        expect(round.playerStates['p1'].cards).not.toContain(
            expect.objectContaining({ value: ActionKind.SECOND_CHANCE })
        )
    })

    it('résout les actions en attente même si le joueur a busté', () => {
        const round = makeRound(['p1', 'p2'])
        round.playerStates['p1'].hasBusted = true
        const freezeCard = makeActionCard(ActionKind.FREEZE)
        drawCard
            .mockReturnValueOnce(freezeCard)
            .mockReturnValueOnce(makeNumberCard(2))
            .mockReturnValueOnce(makeNumberCard(3))
        const resolveAction = vi.fn()

        applyFlipThree(round, 'p1', resolveAction)

        expect(resolveAction).toHaveBeenCalledWith(round, freezeCard, 'p1')
    })
})

// ─── resolveActionCard ────────────────────────────────────────────────────────

describe('resolveActionCard', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    it('applique Freeze sur le joueur ciblé', () => {
        const round = makeRound(['p1', 'p2'])
        const card = makeActionCard(ActionKind.FREEZE)

        resolveActionCard(round, card, 'p1', 'p2')

        expect(round.playerStates['p2'].hasStayed).toBe(true)
        expect(round.activePlayerIds).not.toContain('p2')
    })

    it('retourne l\'action sur la source si aucun autre joueur actif', () => {
        const round = makeRound(['p1'])
        const card = makeActionCard(ActionKind.FREEZE)

        resolveActionCard(round, card, 'p1', undefined)

        expect(round.playerStates['p1'].hasStayed).toBe(true)
    })

    it('retourne l\'action sur la source si targetPlayerId absent', () => {
        const round = makeRound(['p1', 'p2'])
        const card = makeActionCard(ActionKind.FREEZE)

        resolveActionCard(round, card, 'p1', undefined)

        expect(round.playerStates['p1'].hasStayed).toBe(true)
        expect(round.playerStates['p2'].hasStayed).toBe(false)
    })

    it('donne le Second Chance au joueur ciblé', () => {
        const round = makeRound(['p1', 'p2'])
        const card = makeActionCard(ActionKind.SECOND_CHANCE)

        resolveActionCard(round, card, 'p1', 'p2')

        expect(round.playerStates['p2'].hasSecondChance).toBe(true)
    })

    it('ne donne pas un deuxième Second Chance si le joueur en a déjà un', () => {
        const round = makeRound(['p1', 'p2'])
        round.playerStates['p2'].hasSecondChance = true
        const card = makeActionCard(ActionKind.SECOND_CHANCE)

        resolveActionCard(round, card, 'p1', 'p2')

        expect(round.playerStates['p2'].hasSecondChance).toBe(true)
    })

    it('délègue FlipThree à applyFlipThree via le callback resolveActionCard', () => {
        const round = makeRound(['p1', 'p2'])
        const card = makeActionCard(ActionKind.FLIP_THREE)
        drawCard
            .mockReturnValueOnce(makeNumberCard(1))
            .mockReturnValueOnce(makeNumberCard(2))
            .mockReturnValueOnce(makeNumberCard(3))

        resolveActionCard(round, card, 'p1', 'p2')

        expect(drawCard).toHaveBeenCalledTimes(3)
    })
})
