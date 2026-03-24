/**
 * @fileoverview Résolution des cartes Action de Flip 7.
 *
 * Ce fichier gère : Freeze, Flip Three, Second Chance,
 * le ciblage des joueurs actifs et les chaînes d'actions.
 *
 */

import {CardType, ActionKind} from '../constants.js'
import {drawCard} from '../deck.js'
import {getActivePlayerIds, removeFromActive} from "../../utils/utils.js"

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
                if (!playerState.hasSecondChance) {
                    playerState.hasSecondChance = true
                }
            } else {
                pendingActions.push(card)
            }
        } else {
            playerState.cards.push(card)
            // TODO : Méthode qui fait ce check et met à jour hasBusted / hasFlipSeven en conséquence, pour éviter de dupliquer la logique dans plusieurs fonctions
            // if (isBust(playerState) || isFlipSeven(playerState)) {
            //     break
            // }
            // TODO : Sinon méthode qui ajoute la carte au deck du joueur
        }
    }

    // Résolution des actions en attente — même si le joueur a busté
    for (const actionCard of pendingActions) {
        resolveAction(round, actionCard, targetPlayerId)
    }
}

/**
 * Donne le Second Chance au joueur s'il n'en a pas déjà un.
 * Si le joueur en a déjà un, la carte est simplement défaussée — rien ne se passe.
 *
 * @param {PlayerRoundState} playerState
 */
export function applySecondChance(playerState) {
    if (playerState.hasSecondChance) return
    playerState.hasSecondChance = true
}

/**
 * Dispatcher principal pour la résolution d'une ActionCard.
 * Gère le ciblage : si le joueur source est seul actif, l'action se retourne sur lui.
 *
 * @param {Round} round
 * @param {Card} card - La carte action à résoudre
 * @param {string} sourcePlayerId - Le joueur qui joue la carte
 * @param {string} [targetPlayerId] - Le joueur ciblé (optionnel, défini par le client)
 */
export function resolveActionCard(round, card, sourcePlayerId, targetPlayerId) {
    const actives = getActivePlayerIds(round, sourcePlayerId)

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
            if (!round.playerStates[effectiveTargetId].hasSecondChance) {
                round.playerStates[effectiveTargetId].hasSecondChance = true
            }
            break
    }
}
