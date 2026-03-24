/**
 * @fileoverview Résolution des cartes Action de Flip 7.
 *
 * Ce fichier gère : Freeze, Flip Three, Second Chance,
 * le ciblage des joueurs actifs et les chaînes d'actions.
 *
 */

import {CardType, ActionKind} from './constants.js'
import {drawCard} from './deck.js'
import {static} from "express";

// ─── Import T06 ───────────────────────────────────────────────────────────────
// Décommentez quand rules.js est prêt :
// import { isBust } from './bust.js'

// Stubs temporaires le temps que T06 soit livré
const isBust = (playerState) => {
    throw new Error('isBust non implémenté (T06)')
}
const checkFlipSeven = (playerState) => {
    throw new Error('checkFlipSeven non implémenté (T06)')
}

// ─── Helpers internes ─────────────────────────────────────────────────────────

/**
 * Retourne les IDs des joueurs encore actifs dans le round,
 * en excluant optionnellement un joueur (ex : le joueur courant).
 *
 * @param {Round} round
 * @param {string} [excludePlayerId]
 * @returns {string[]}
 */
function getActivePlayerIds(round, excludePlayerId) {
    return round.activePlayerIds.filter(id => id !== excludePlayerId)
}

/**
 * Retire un joueur de la liste des joueurs actifs du round.
 * Mute activePlayerIds directement.
 *
 * @param {Round} round
 * @param {string} playerId
 */
function removeFromActive(round, playerId) {
    const index = round.activePlayerIds.indexOf(playerId)
    if (index !== -1) round.activePlayerIds.splice(index, 1)
}

/**
 * Ajoute une carte à la ligne d'un joueur, puis vérifie bust et Flip 7.
 * Mute playerState directement.
 * Retourne true si le round doit s'arrêter (bust ou Flip 7).
 *
 * @param {Round} round
 * @param {string} playerId
 * @param {Card} card
 * @returns {boolean} roundShouldStop
 */
function addCardToPlayer(round, playerId, card) {
    const playerState = round.playerStates[playerId]
    playerState.cards.push(card)

    if (isBust(playerState)) {
        playerState.hasBusted = true
        removeFromActive(round, playerId)
        return true
    }

    if (checkFlipSeven(playerState)) {
        playerState.hasFlipSeven = true
        return true
    }

    return false
}

// ─── Résolution des cartes Action ─────────────────────────────────────────────

/**
 * Applique un Freeze sur le joueur ciblé.
 * Le joueur banke ses points actuels et sort du round sans buster.
 *
 * @param {Round} round
 * @param {string} targetPlayerId
 */
export function applyFreeze(round, targetPlayerId) {
    const playerState = round.playerStates[targetPlayerId]

    if (playerState.hasBusted || playerState.hasStayed) return

    // playerState.roundScore = calculateRoundScore(playerState)
    playerState.hasStayed = true
    removeFromActive(round, targetPlayerId)
}

/**
 * Applique un Second Chance : annule un bust imminent en discardant
 * la carte en doublon et la carte Second Chance.
 * À appeler avant de setter hasBusted = true.
 *
 * @param {Round} round
 * @param {string} playerId
 * @param {Card} duplicateCard - La carte en doublon piochée
 * @returns {boolean} true si le Second Chance a été consommé, false si le joueur n'en avait pas
 */
export function applySecondChance(round, playerId) {
    const playerState = round.playerStates[playerId]

    if (!playerState.hasSecondChance) return false

    playerState.hasSecondChance = false

    return true
}

/**
 * Résout un Flip Three : force le joueur ciblé à piocher 3 cartes.
 *
 * Règles de résolution :
 * - On s'arrête avant 3 cartes si le joueur buste ou réussit un Flip 7.
 * - Si une ActionCard (Freeze / Flip Three) apparaît parmi les 3 cartes,
 *   elle est mise en attente et résolue APRÈS les 3 tirages (même si bust).
 * - Si un Second Chance apparaît, il est géré immédiatement (donné au joueur
 *   ou discardé s'il en a déjà un).
 * - Les ModifierCards sont ajoutées à la ligne du joueur normalement.
 *
 * @param {Round} round
 * @param {string} targetPlayerId
 * @param {(round: Round, card: Card, sourcePlayerId: string) => void} resolveAction
 *   Callback de résolution d'une action — on passe resolveActionCard pour gérer les chaînes.
 *   Le sourcePlayerId est le joueur qui résout l'action chaînée (le busted peut toujours cibler).
 */
export function applyFlipThree(round, targetPlayerId, resolveAction) {
    const playerState = round.playerStates[targetPlayerId]
    const pendingActions = []
    let cardsDrawn = 0

    while (cardsDrawn < 3) {
        const card = drawCard(round.deck)
        cardsDrawn++

        if (card.type === CardType.ACTION) {
            if (card.value === ActionKind.SECOND_CHANCE) {
                // Second Chance : donner au joueur s'il n'en a pas, sinon transférer ou discard
                if (!playerState.hasSecondChance) {
                    playerState.hasSecondChance = true
                }
            } else {
                // Freeze ou Flip Three : mise en attente, résolu après les 3 tirages
                pendingActions.push(card)
            }
        } else {
            // NumberCard ou ModifierCard : ajout à la ligne du joueur
            // Méthode slay qui contient le drawCard, le computeRoundScore, le addCardToPlayer
            const shouldStop = addCardToPlayer(round, targetPlayerId, card)
            if (shouldStop) break
        }
    }

    // Résolution des actions en attente — même si le joueur a busté
    for (const actionCard of pendingActions) {
        resolveAction(round, actionCard, targetPlayerId)
    }
}

/**
 * Dispatcher principal pour la résolution d'une ActionCard.
 * Gère le ciblage : si le joueur source est seul actif, l'action se retourne sur lui.
 *
 * @param {Round} round
 * @param {Card} card          - La carte action à résoudre
 * @param {string}                        sourcePlayerId - Le joueur qui joue la carte
 * @param {string}                        [targetPlayerId] - Le joueur ciblé (optionnel, défini par le client)
 */
export function resolveActionCard(round, card, sourcePlayerId, targetPlayerId) {
    const actives = getActivePlayerIds(round, sourcePlayerId)

    // Si aucun autre joueur actif, l'action se retourne sur la source
    const effectiveTargetId = (actives.length === 0 || !targetPlayerId)
        ? sourcePlayerId
        : targetPlayerId

    switch (card.value) {
        case ActionKind.FREEZE:
            applyFreeze(round, effectiveTargetId)
            break

        case ActionKind.FLIP_THREE:
            applyFlipThree(round, effectiveTargetId, resolveActionCard)
            break

        case ActionKind.SECOND_CHANCE:
            // Second Chance joué depuis la main : donné à un autre joueur actif
            // (cas rare, normalement géré dans applyFlipThree)
            if (!round.playerStates[effectiveTargetId].hasSecondChance) {
                round.playerStates[effectiveTargetId].hasSecondChance = true
            }
            break
    }
}
