import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
    processSlay,
    processStay,
    advanceToNextPlayer,
    finalizeRound,
    closeRound,
} from '../../../src/domain/game/gameEngine.js'
import { CardType, RoundPhase, GameStatus } from '../../../src/domain/constants.js'

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../../../src/domain/deck.js', () => ({
    drawCard: vi.fn(),
    shuffle: vi.fn(a => [...a]),
    createDeck: vi.fn(() => []),
}))
vi.mock('../../../src/domain/logic/playerState.js', () => ({
    isBust: vi.fn(),
    isFlipSeven: vi.fn(),
}))
vi.mock('../../../src/domain/logic/scoring.js', () => ({
    computeRoundScore: vi.fn(),
    updateCumulativeScores: vi.fn(),
}))
vi.mock('../../../src/domain/logic/action.js', () => ({
    resolveActionCard: vi.fn(),
}))
vi.mock('../../../src/domain/logic/victory.js', () => ({
    evaluateVictory: vi.fn(),
}))
vi.mock('../../../src/domain/factories.js', () => ({
    createRound: vi.fn(),
}))

import { drawCard }                         from '../../../src/domain/deck.js'
import { isBust, isFlipSeven }             from '../../../src/domain/logic/playerState.js'
import { computeRoundScore, updateCumulativeScores } from '../../../src/domain/logic/scoring.js'
import { resolveActionCard }                from '../../../src/domain/logic/action.js'
import { evaluateVictory }                  from '../../../src/domain/logic/victory.js'
import { createRound }                      from '../../../src/domain/factories.js'

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

function makeRound(playerIds, overrides = {}) {
    return {
        phase: RoundPhase.PLAYING,
        deck: [],
        discardPile: [],
        currentPlayerIndex: 0,
        startingPlayerIndex: 0,
        activePlayerIds: [...playerIds],
        playerStates: Object.fromEntries(playerIds.map(id => [id, makePlayerState(id)])),
        ...overrides,
    }
}

function makeGameState(playerIds, overrides = {}) {
    const players = playerIds.map(id => ({ id, name: id, socketId: `socket-${id}` }))
    return {
        id: 'game-1',
        status: GameStatus.PLAYING,
        players,
        round: makeRound(playerIds),
        scores: Object.fromEntries(playerIds.map(id => [id, 0])),
        dealerIndex: 0,
        ...overrides,
    }
}

function makePlayers(ids) {
    return ids.map(id => ({ id, name: id, socketId: `socket-${id}` }))
}

function makeNumberCard(value) {
    return { id: `num-${value}`, type: CardType.NUMBER, value }
}

function makeActionCard(action) {
    return { id: `action-${action}`, type: CardType.ACTION, value: action }
}

// ─── processSlay ─────────────────────────────────────────────────────────────

describe('processSlay', () => {
    beforeEach(() => vi.clearAllMocks())

    describe('carte Action', () => {
        it('appelle resolveActionCard et retourne roundOver false si des joueurs restent', () => {
            const round = makeRound(['p1', 'p2'])
            drawCard.mockReturnValue(makeActionCard('freeze'))

            const result = processSlay(round, 'p1', 'p2')

            expect(resolveActionCard).toHaveBeenCalledWith(round, expect.objectContaining({ type: CardType.ACTION }), 'p1', 'p2')
            expect(result.roundOver).toBe(false)
            expect(result.flipSeven).toBe(false)
        })

        it('détecte un Flip 7 déclenché via FlipThree et vide activePlayerIds', () => {
            const round = makeRound(['p1', 'p2'])
            drawCard.mockReturnValue(makeActionCard('flipThree'))
            resolveActionCard.mockImplementation(() => {
                round.playerStates['p2'].hasFlipSeven = true
            })

            const result = processSlay(round, 'p1', 'p2')

            expect(result.flipSeven).toBe(true)
            expect(result.roundOver).toBe(true)
            expect(round.activePlayerIds).toHaveLength(0)
        })

        it('calcule le score des joueurs gelés par Freeze après resolveActionCard', () => {
            const round = makeRound(['p1', 'p2'])
            drawCard.mockReturnValue(makeActionCard('freeze'))
            resolveActionCard.mockImplementation(() => {
                round.playerStates['p2'].hasStayed = true
            })

            processSlay(round, 'p1', 'p2')

            expect(computeRoundScore).toHaveBeenCalledWith(round.playerStates['p2'])
        })
    })

    describe('carte NUMBER / MODIFIER', () => {
        it('ajoute la carte à la main du joueur', () => {
            const round = makeRound(['p1'])
            const card = makeNumberCard(7)
            drawCard.mockReturnValue(card)
            isBust.mockReturnValue(false)
            isFlipSeven.mockReturnValue(false)

            processSlay(round, 'p1')

            expect(round.playerStates['p1'].cards).toContain(card)
        })

        it('appelle computeRoundScore après ajout de la carte', () => {
            const round = makeRound(['p1'])
            drawCard.mockReturnValue(makeNumberCard(5))
            isBust.mockReturnValue(false)
            isFlipSeven.mockReturnValue(false)

            processSlay(round, 'p1')

            expect(computeRoundScore).toHaveBeenCalledWith(round.playerStates['p1'])
        })

        it('retourne roundOver false et flipSeven false si rien de particulier', () => {
            const round = makeRound(['p1'])
            drawCard.mockReturnValue(makeNumberCard(3))
            isBust.mockReturnValue(false)
            isFlipSeven.mockReturnValue(false)

            expect(processSlay(round, 'p1')).toEqual({ roundOver: false, flipSeven: false })
        })

        describe('bust', () => {
            it('retire le joueur des actifs après un bust', () => {
                const round = makeRound(['p1', 'p2'])
                drawCard.mockReturnValue(makeNumberCard(5))
                isBust.mockImplementation(ps => { ps.hasBusted = true })

                processSlay(round, 'p1')

                expect(round.activePlayerIds).not.toContain('p1')
                expect(round.activePlayerIds).toContain('p2')
            })

            it('calcule le score avant de retirer le joueur', () => {
                const round = makeRound(['p1'])
                drawCard.mockReturnValue(makeNumberCard(5))
                isBust.mockImplementation(ps => { ps.hasBusted = true })

                processSlay(round, 'p1')

                expect(computeRoundScore).toHaveBeenCalledWith(round.playerStates['p1'])
            })

            it('retourne roundOver true si c\'était le dernier joueur actif', () => {
                const round = makeRound(['p1'])
                drawCard.mockReturnValue(makeNumberCard(5))
                isBust.mockImplementation(ps => { ps.hasBusted = true })

                const result = processSlay(round, 'p1')

                expect(result.roundOver).toBe(true)
                expect(result.flipSeven).toBe(false)
            })
        })

        describe('Flip 7', () => {
            it('marque hasFlipSeven et vide activePlayerIds', () => {
                const round = makeRound(['p1', 'p2'])
                drawCard.mockReturnValue(makeNumberCard(7))
                isBust.mockReturnValue(false)
                isFlipSeven.mockReturnValue(true)

                processSlay(round, 'p1')

                expect(round.playerStates['p1'].hasFlipSeven).toBe(true)
                expect(round.activePlayerIds).toHaveLength(0)
            })

            it('retourne roundOver true et flipSeven true', () => {
                const round = makeRound(['p1', 'p2'])
                drawCard.mockReturnValue(makeNumberCard(7))
                isBust.mockReturnValue(false)
                isFlipSeven.mockReturnValue(true)

                expect(processSlay(round, 'p1')).toEqual({ roundOver: true, flipSeven: true })
            })

            it('calcule le score avant de vider les actifs', () => {
                const round = makeRound(['p1'])
                drawCard.mockReturnValue(makeNumberCard(7))
                isBust.mockReturnValue(false)
                isFlipSeven.mockReturnValue(true)

                processSlay(round, 'p1')

                expect(computeRoundScore).toHaveBeenCalledWith(round.playerStates['p1'])
            })
        })
    })
})

// ─── processStay ──────────────────────────────────────────────────────────────

describe('processStay', () => {
    beforeEach(() => vi.clearAllMocks())

    it('marque le joueur comme stayed et le retire des actifs', () => {
        const round = makeRound(['p1', 'p2'])

        processStay(round, 'p1')

        expect(round.playerStates['p1'].hasStayed).toBe(true)
        expect(round.activePlayerIds).not.toContain('p1')
        expect(round.activePlayerIds).toContain('p2')
    })

    it('calcule le score avant de marquer stayed', () => {
        const round = makeRound(['p1'])

        processStay(round, 'p1')

        expect(computeRoundScore).toHaveBeenCalledWith(round.playerStates['p1'])
    })

    it('ne fait rien si le joueur a déjà busté', () => {
        const round = makeRound(['p1'])
        round.playerStates['p1'].hasBusted = true

        processStay(round, 'p1')

        expect(computeRoundScore).not.toHaveBeenCalled()
        expect(round.playerStates['p1'].hasStayed).toBe(false)
    })

    it('ne fait rien si le joueur a déjà stayed', () => {
        const round = makeRound([])
        round.playerStates = { p1: makePlayerState('p1', { hasStayed: true }) }

        processStay(round, 'p1')

        expect(computeRoundScore).not.toHaveBeenCalled()
    })

    it('retourne roundOver true si c\'était le dernier joueur actif', () => {
        const round = makeRound(['p1'])
        expect(processStay(round, 'p1').roundOver).toBe(true)
    })

    it('retourne roundOver false si d\'autres joueurs sont encore actifs', () => {
        const round = makeRound(['p1', 'p2'])
        expect(processStay(round, 'p1').roundOver).toBe(false)
    })
})

// ─── advanceToNextPlayer ──────────────────────────────────────────────────────

describe('advanceToNextPlayer', () => {
    it('passe au joueur suivant dans l\'ordre', () => {
        const round = makeRound(['p1', 'p2', 'p3'])
        round.currentPlayerIndex = 0

        advanceToNextPlayer(round, makePlayers(['p1', 'p2', 'p3']))

        expect(round.currentPlayerIndex).toBe(1)
    })

    it('boucle sur le premier joueur après le dernier', () => {
        const round = makeRound(['p1', 'p2', 'p3'])
        round.currentPlayerIndex = 2

        advanceToNextPlayer(round, makePlayers(['p1', 'p2', 'p3']))

        expect(round.currentPlayerIndex).toBe(0)
    })

    it('saute les joueurs bustés', () => {
        const round = makeRound(['p1', 'p3'])
        round.currentPlayerIndex = 0
        round.playerStates['p2'] = makePlayerState('p2', { hasBusted: true })

        advanceToNextPlayer(round, makePlayers(['p1', 'p2', 'p3']))

        expect(round.currentPlayerIndex).toBe(2)
    })

    it('saute les joueurs stayed', () => {
        const round = makeRound(['p1', 'p3'])
        round.currentPlayerIndex = 0
        round.playerStates['p2'] = makePlayerState('p2', { hasStayed: true })

        advanceToNextPlayer(round, makePlayers(['p1', 'p2', 'p3']))

        expect(round.currentPlayerIndex).toBe(2)
    })
})

// ─── finalizeRound ────────────────────────────────────────────────────────────

describe('finalizeRound', () => {
    beforeEach(() => vi.clearAllMocks())

    it('passe la phase du round à SCORING', () => {
        const round = makeRound(['p1', 'p2'])
        const gameState = { scores: { p1: 0, p2: 0 } }

        finalizeRound(round, gameState)

        expect(round.phase).toBe(RoundPhase.SCORING)
    })

    it('appelle updateCumulativeScores pour chaque joueur', () => {
        const round = makeRound(['p1', 'p2'])
        const gameState = { scores: { p1: 50, p2: 80 } }

        finalizeRound(round, gameState)

        expect(updateCumulativeScores).toHaveBeenCalledTimes(2)
        expect(updateCumulativeScores).toHaveBeenCalledWith(round.playerStates['p1'], gameState)
        expect(updateCumulativeScores).toHaveBeenCalledWith(round.playerStates['p2'], gameState)
    })

    it('pousse les cartes des joueurs dans discardPile', () => {
        const round = makeRound(['p1'])
        const card = makeNumberCard(5)
        round.playerStates['p1'].cards = [card]
        const gameState = { scores: { p1: 0 } }

        finalizeRound(round, gameState)

        expect(round.discardPile).toContain(card)
    })
})

// ─── closeRound ───────────────────────────────────────────────────────────────

describe('closeRound', () => {
    beforeEach(() => vi.clearAllMocks())

    it('marque la partie FINISHED si un seul gagnant', () => {
        const gameState = makeGameState(['p1', 'p2'])
        evaluateVictory.mockReturnValue(['p1'])

        const result = closeRound(gameState)

        expect(gameState.status).toBe(GameStatus.FINISHED)
        expect(result.gameOver).toBe(true)
        expect(result.winners).toEqual(['p1'])
    })

    it('ne termine pas la partie si aucun gagnant', () => {
        const gameState = makeGameState(['p1', 'p2'])
        evaluateVictory.mockReturnValue([])
        createRound.mockReturnValue(makeRound(['p1', 'p2']))

        const result = closeRound(gameState)

        expect(result.gameOver).toBe(false)
        expect(gameState.status).toBe(GameStatus.PLAYING)
    })

    it('ne termine pas la partie en cas d\'égalité (manche supp.)', () => {
        const gameState = makeGameState(['p1', 'p2'])
        evaluateVictory.mockReturnValue(['p1', 'p2'])
        createRound.mockReturnValue(makeRound(['p1', 'p2']))

        const result = closeRound(gameState)

        expect(result.gameOver).toBe(false)
        expect(result.winners).toEqual(['p1', 'p2'])
    })

    it('fait tourner le dealer au joueur suivant', () => {
        const gameState = makeGameState(['p1', 'p2', 'p3'])
        gameState.round.startingPlayerIndex = 1
        evaluateVictory.mockReturnValue([])
        createRound.mockReturnValue(makeRound(['p1', 'p2', 'p3']))

        closeRound(gameState)

        expect(gameState.dealerIndex).toBe(2)
    })

    it('crée un nouveau round avec le prochain dealer', () => {
        const gameState = makeGameState(['p1', 'p2'])
        evaluateVictory.mockReturnValue([])
        const newRound = makeRound(['p1', 'p2'])
        createRound.mockReturnValue(newRound)

        closeRound(gameState)

        expect(createRound).toHaveBeenCalled()
        expect(gameState.round).toBe(newRound)
    })
})
