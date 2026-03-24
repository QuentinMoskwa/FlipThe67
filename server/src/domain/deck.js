/**
 * @fileoverview Logique de génération et de mélange du deck Flip 7.
 *
 * Composition officielle - 94 cartes :
 *   - 79 cartes numérotées : la valeur N apparaît N fois (sauf 0 → 1 exemplaire)
 *   - 6 cartes modificateur : x2, +2, +4, +6, +8, +10 (1 exemplaire chacune)
 *   - 9 cartes action : Freeze x 3, FlipThree x 3, SecondChance x 3
 */

import {ActionKind, ModifierKind} from './constants.js'
import {createNumberCard, createActionCard, createModifierCard} from './factories.js'

// ─── Composition du deck ──────────────────────────────────────────────────────

/**
 * Nombre d'exemplaires de chaque carte numérotée.
 * Clé = valeur de la carte, valeur = nombre d'exemplaires dans le deck.
 * @type {Record<number, number>}
 */
const NUMBER_CARD_COUNTS = Object.freeze({
    0: 1,
    1: 1,
    2: 2,
    3: 3,
    4: 4,
    5: 5,
    6: 6,
    7: 7,
    8: 8,
    9: 9,
    10: 10,
    11: 11,
    12: 12,
})

/**
 * Un exemplaire de chaque carte modificateur.
 * @type {ModifierKind[]}
 */
const MODIFIER_CARDS = Object.freeze([
    ModifierKind.X2,
    ModifierKind.PLUS2,
    ModifierKind.PLUS4,
    ModifierKind.PLUS6,
    ModifierKind.PLUS8,
    ModifierKind.PLUS10,
])

/**
 * Trois exemplaires de chaque carte action.
 * @type {ActionKind[]}
 */
const ACTION_CARDS = Object.freeze([
    ActionKind.FREEZE, ActionKind.FREEZE, ActionKind.FREEZE,
    ActionKind.FLIP_THREE, ActionKind.FLIP_THREE, ActionKind.FLIP_THREE,
    ActionKind.SECOND_CHANCE, ActionKind.SECOND_CHANCE, ActionKind.SECOND_CHANCE,
])

// ─── Fonctions ────────────────────────────────────────────────────────────────

/**
 * Mélange un tableau selon l'algorithme Fisher-Yates.
 * Fonction pure : retourne un nouveau tableau, ne mute pas l'original.
 *
 * @template T
 * @param {T[]} array
 * @returns {T[]}
 */
export function shuffle(array) {
    const result = [...array]
    for (let i = result.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[result[i], result[j]] = [result[j], result[i]]
    }
    return result
}

/**
 * Génère un deck Flip 7 complet et mélangé (94 cartes).
 * Les IDs sont produits par crypto.randomUUID() via les factories.
 *
 * @returns {Card[]}
 */
export function createDeck() {
    const numberCards = Object.entries(NUMBER_CARD_COUNTS).flatMap(
        ([value, count]) => Array.from({length: count}, () => createNumberCard(Number(value)))
    )

    const modifierCards = MODIFIER_CARDS.map(createModifierCard)
    const actionCards = ACTION_CARDS.map(createActionCard)

    return shuffle([...numberCards, ...modifierCards, ...actionCards])
}

/**
 * Pioche la première carte du deck.
 * Si le deck est vide, un nouveau deck complet est généré et mélangé.
 * Mute le tableau deck directement.
 *
 * @param {Card[]} deck
 * @returns {Card}
 */
export function drawCard(deck) {
    if (deck.length === 0) {
        deck.push(...createDeck())
    }
    return deck.shift()
}
