/**
 * @fileoverview Factories du domaine Flip 7.
 *
 * Chaque entité est modélisée comme une classe.
 * Les constructeurs sont intentionnellement privés - on passe
 * toujours par les factory functions exportées pour garantir
 * la cohérence des IDs et des valeurs par défaut.
 *
 * Pattern appliqué : Factory Method + Discriminated Union pour Card.
 */

import {
    CardType,
    ActionKind,
    ModifierKind,
    RoundPhase,
    GameStatus,
} from './constants.js'

// ─── Card ─────────────────────────────────────────────────────────────────────

/**
 * Carte numérotée (valeur 0 à 12).
 * La seule qui peut provoquer un bust ou déclencher le bonus Flip 7.
 *  ---
 * Carte action (Freeze, Flip Three, Second Chance).
 * Ciblée sur un autre joueur actif ou sur soi-même si on est seul.
 *  ---
 * Carte modificateur (x2, +2 … +10).
 * Modifie le score final de la manche, ne compte pas pour le Flip 7.
 */
export class Card {

    constructor(id, cardType, value) {
        this.id = id
        this.type = cardType
        this.value = value
    }
}


// ─── Player ───────────────────────────────────────────────────────────────────

/**
 * Représente un joueur connecté à la partie.
 * socketId est mis à jour à chaque reconnexion - c'est la seule
 * propriété de Player qui est mutable après création.
 */
export class Player {

    constructor(id, name, socketId) {
        this.id = id
        this.name = name
        this.socketId = socketId
    }
}

// ─── PlayerRoundState ─────────────────────────────────────────────────────────

/**
 * État éphémère d'un joueur pour la manche en cours.
 * Recréé à chaque nouveau round via createRound().
 * playerId permet à cet objet d'être auto-descriptif
 * même quand il est manipulé hors de sa map parente.
 */
export class PlayerRoundState {

    constructor(playerId) {
        this.playerId = playerId
        this.cards = []
        this.hasBusted = false
        this.hasStayed = false
        this.hasFlipSeven = false
        this.hasSecondChance = false
        this.roundScore = 0
    }
}

// ─── Round ────────────────────────────────────────────────────────────────────

/**
 * Représente une manche complète de Flip 7.
 * playerStates est une map pour le lookup O(1) par playerId,
 * mais chaque valeur contient son propre playerId pour rester
 * auto-descriptive quand elle est manipulée isolément.
 */
export class Round {

    constructor(startingPlayerIndex, deck, playerStates, activePlayerIds) {
        this.phase = RoundPhase.DEALING
        this.startingPlayerIndex = startingPlayerIndex
        this.currentPlayerIndex = startingPlayerIndex
        this.deck = deck
        this.playerStates = playerStates
        this.activePlayerIds = activePlayerIds
    }
}

// ─── GameState ────────────────────────────────────────────────────────────────

/**
 * État global de la partie.
 * C'est l'objet racine diffusé aux clients via Socket.io
 * après chaque action (game-state-update).
 */
export class GameState {

    constructor(id, players, scores) {
        this.id = id
        this.status = GameStatus.WAITING
        this.players = players
        this.round = null
        this.scores = scores
        this.dealerIndex = 0
    }
}

// ─── Factory functions ────────────────────────────────────────────────────────

/**
 * @param {number} value
 * @returns {Card}
 */
export function createNumberCard(value) {
    return new Card(crypto.randomUUID(), CardType.NUMBER, value)
}

/**
 * @param {ActionKind} action
 * @returns {Card}
 */
export function createActionCard(action) {
    return new Card(crypto.randomUUID(), CardType.ACTION, action)
}

/**
 * @param {ModifierKind} modifier
 * @returns {Card}
 */
export function createModifierCard(modifier) {
    return new Card(crypto.randomUUID(), CardType.MODIFIER, modifier)
}

/**
 * @param {string} name
 * @param {string} socketId
 * @returns {Player}
 */
export function createPlayer(name, socketId) {
    return new Player(crypto.randomUUID(), name, socketId)
}

/**
 * @param {Player[]} players
 * @param {Card[]}   deck   - Deck déjà mélangé (produit par createDeck dans deck.js)
 * @param {number}   startingPlayerIndex
 * @returns {Round}
 */
export function createRound(players, deck, startingPlayerIndex) {
    const playerStates = Object.fromEntries(
        players.map(p => [p.id, new PlayerRoundState(p.id)])
    )

    return new Round(
        startingPlayerIndex,
        deck,
        playerStates,
        players.map(p => p.id),
    )
}

/**
 * @param {Player[]} players
 * @returns {GameState}
 */
export function createGameState(players) {
    const scores = Object.fromEntries(players.map(p => [p.id, 0]))
    return new GameState(crypto.randomUUID(), players, scores)
}
