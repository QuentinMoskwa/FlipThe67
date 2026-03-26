import { describe, it, expect, vi } from 'vitest'
import { shuffle, createDeck, drawCard } from '../../src/domain/deck.js'
import { CardType, ActionKind, ModifierKind } from '../../src/domain/constants.js'

// ─── shuffle ──────────────────────────────────────────────────────────────────

describe('shuffle', () => {

    it('retourne un tableau de même longueur', () => {
        const array = [1, 2, 3, 4, 5]
        expect(shuffle(array)).toHaveLength(5)
    })

    it('contient les mêmes éléments que l\'original', () => {
        const array = [1, 2, 3, 4, 5]
        expect(shuffle(array).sort()).toEqual([...array].sort())
    })

    it('ne mute pas le tableau d\'origine', () => {
        const array = [1, 2, 3, 4, 5]
        const copy  = [...array]
        shuffle(array)
        expect(array).toEqual(copy)
    })

    it('retourne un nouveau tableau', () => {
        const array = [1, 2, 3]
        expect(shuffle(array)).not.toBe(array)
    })

    it('gère un tableau vide', () => {
        expect(shuffle([])).toEqual([])
    })

    it('gère un tableau à un élément', () => {
        expect(shuffle([42])).toEqual([42])
    })
})

// ─── createDeck ───────────────────────────────────────────────────────────────

describe('createDeck', () => {

    it('génère exactement 94 cartes', () => {
        expect(createDeck()).toHaveLength(94)
    })

    it('génère 79 cartes numérotées', () => {
        const deck = createDeck()
        const numberCards = deck.filter(c => c.type === CardType.NUMBER)
        expect(numberCards).toHaveLength(79)
    })

    it('génère 6 cartes modificateur', () => {
        const deck = createDeck()
        const modifierCards = deck.filter(c => c.type === CardType.MODIFIER)
        expect(modifierCards).toHaveLength(6)
    })

    it('génère 9 cartes action', () => {
        const deck = createDeck()
        const actionCards = deck.filter(c => c.type === CardType.ACTION)
        expect(actionCards).toHaveLength(9)
    })

    it('génère le bon nombre d\'exemplaires par valeur numérotée', () => {
        const deck = createDeck()
        const numberCards = deck.filter(c => c.type === CardType.NUMBER)

        const countByValue = numberCards.reduce((acc, card) => {
            acc[card.value] = (acc[card.value] ?? 0) + 1
            return acc
        }, {})

        expect(countByValue[0]).toBe(1)
        expect(countByValue[1]).toBe(1)
        expect(countByValue[7]).toBe(7)
        expect(countByValue[12]).toBe(12)
    })

    it('génère un exemplaire de chaque modificateur', () => {
        const deck = createDeck()
        const modifierCards = deck.filter(c => c.type === CardType.MODIFIER)
        const modifierValues = modifierCards.map(c => c.value)

        expect(modifierValues).toContain(ModifierKind.X2)
        expect(modifierValues).toContain(ModifierKind.PLUS2)
        expect(modifierValues).toContain(ModifierKind.PLUS10)
    })

    it('génère 3 exemplaires de chaque carte action', () => {
        const deck = createDeck()
        const actionCards = deck.filter(c => c.type === CardType.ACTION)

        const countByAction = actionCards.reduce((acc, card) => {
            acc[card.value] = (acc[card.value] ?? 0) + 1
            return acc
        }, {})

        expect(countByAction[ActionKind.FREEZE]).toBe(3)
        expect(countByAction[ActionKind.FLIP_THREE]).toBe(3)
        expect(countByAction[ActionKind.SECOND_CHANCE]).toBe(3)
    })

    it('génère des cartes avec des IDs uniques', () => {
        const deck = createDeck()
        const ids = deck.map(c => c.id)
        const uniqueIds = new Set(ids)
        expect(uniqueIds.size).toBe(94)
    })

    it('deux decks générés ont des ordres différents', () => {
        const deck1 = createDeck()
        const deck2 = createDeck()
        const ids1 = deck1.map(c => c.value)
        const ids2 = deck2.map(c => c.value)
        expect(ids1).not.toEqual(ids2)
    })
})

// ─── drawCard ─────────────────────────────────────────────────────────────────

describe('drawCard', () => {

    it('retourne la première carte du deck', () => {
        const deck = createDeck()
        const firstCard = deck[0]
        expect(drawCard(deck)).toBe(firstCard)
    })

    it('réduit la taille du deck de 1', () => {
        const deck = createDeck()
        drawCard(deck)
        expect(deck).toHaveLength(93)
    })

    it('mute le deck directement', () => {
        const deck = createDeck()
        const ref  = deck
        drawCard(deck)
        expect(deck).toBe(ref)
    })

    it('régénère un deck complet si le deck est vide', () => {
        const deck = []
        const discardPile = createDeck()
        drawCard(deck, discardPile)
        expect(deck).toHaveLength(93)
    })

    it('retourne bien une carte quand le deck était vide', () => {
        const deck = []
        const discardPile = createDeck()
        const card = drawCard(deck, discardPile)
        expect(card).toHaveProperty('id')
        expect(card).toHaveProperty('type')
        expect(card).toHaveProperty('value')
    })

    it('pioche toutes les cartes dans l\'ordre sans erreur', () => {
        const deck = createDeck()
        const drawn = []
        while (deck.length > 0) {
            drawn.push(drawCard(deck))
        }
        expect(drawn).toHaveLength(94)
        expect(deck).toHaveLength(0)
    })
})
