/**
 * @fileoverview Moteur de jeu FlipThe67.
 *
 * Orchestre les actions des joueurs pendant la phase Playing.
 * Ce fichier est le point d'entrée unique pour toute mutation
 * de GameState pendant un round - les handlers Socket.io ne font
 * qu'appeler ces fonctions et diffuser le GameState résultant.
 *
 * Dépendances :
 *   - deck.js → drawCard
 *   - playerState.js → isBust, isFlipSeven
 *   - scoring.js → computeRoundScore, updateCumulativeScores
 *   - actions.js → resolveActionCard
 *   - utils.js → removeFromActive
 */

import {CardType, GameStatus, RoundPhase, ActionKind} from '../constants.js'
import {createDeck, drawCard, shuffle} from '../deck.js'
import {isBust, isFlipSeven} from '../logic/playerState.js'
import {computeRoundScore, updateCumulativeScores} from '../logic/scoring.js'
import {resolveActionCard} from '../logic/action.js'
import {removeFromActive, isRoundOver, getOrderedPlayers} from '../utils/utils.js'
import {createRound} from "../factories.js";
import {evaluateVictory} from "../logic/victory.js";

/**
 * Calcule le score des joueurs gelés par un Freeze.
 * computeRoundScore est idempotent - safe à appeler plusieurs fois.
 *
 * @param {Round} round
 */
function computeScoreForStayedPlayers(round) {
    for (const playerState of Object.values(round.playerStates)) {
        if (playerState.hasStayed && !playerState.hasBusted) {
            computeRoundScore(playerState)
        }
    }
}

// ─── Actions joueur ───────────────────────────────────────────────────────────

/**
 * Traite l'action Slay (Hit) d'un joueur : pioche une carte et résout son effet.
 * que pendant le PLAYING (choix du joueur).
 *
 * Flux :
 *   ACTION   → resolveActionCard → computeScoreForStayedPlayers
 *   NUMBER / MODIFIER → push → isBust → isFlipSeven → computeRoundScore
 *
 * @param {Round}  round
 * @param {string} playerId
 * @param {string} [targetPlayerId] - Cible d'une ActionCard (fourni par le client)
 * @returns {{ roundOver: boolean, flipSeven: boolean }}
 */
export function processSlay(round, playerId, targetPlayerId) {
    const playerState = round.playerStates[playerId];
    const card = drawCard(round.deck, round.discardPile);

    if (card.type === CardType.ACTION) {
        // Freeze et FlipThree nécessitent une cible
        if ( card.value === ActionKind.FREEZE || card.value === ActionKind.FLIP_THREE) {
            // Vérifie si d'autres joueurs actifs existent (excluant la source)
            const otherActives = round.activePlayerIds.filter(id => id !== playerId)

            if (otherActives.length === 0) {
                // Dernier joueur actif : résolution immédiate sur soi-même
                resolveActionCard(round, card, playerId, undefined)
                computeScoreForStayedPlayers(round)
                return {
                    roundOver: isRoundOver(round),
                    flipSeven: false,
                    needsTarget: false,
                    card,
                }
            }
            // Stocker l'action en attente le temps que le joueur choississe sa cible
            round.pendingAction = { card, sourcePlayerId: playerId };
            return { roundOver: false, flipSeven: false, needsTarget: true, card };
        }

        // SecondChance → résolution immédiate, pas de cible
        resolveActionCard(round, card, playerId, undefined);
        computeScoreForStayedPlayers(round);
        return {
        roundOver: isRoundOver(round),
        flipSeven: false,
        needsTarget: false,
        card,
        };
    }

    // NUMBER ou MODIFIER
    playerState.cards.push(card);

    isBust(playerState, round.discardPile);

    if (playerState.hasBusted) {
        round.discardPile.push(playerState.cards.pop());
        computeRoundScore(playerState);
        removeFromActive(round, playerId);
        return {
        roundOver: isRoundOver(round),
        flipSeven: false,
        needsTarget: false,
        card,
        };
    }

    if (isFlipSeven(playerState.cards)) {
        playerState.hasFlipSeven = true;
        computeRoundScore(playerState);
        round.activePlayerIds = [];
        return { roundOver: true, flipSeven: true, needsTarget: false, card };
    }

    computeRoundScore(playerState);
    return { roundOver: false, flipSeven: false, needsTarget: false, card };
}

/**
 * Traite l'action Stay d'un joueur : banke ses points et sort du round.
 *
 * @param {Round}  round
 * @param {string} playerId
 * @returns {{ roundOver: boolean }}
 */
export function processStay(round, playerId) {
    const playerState = round.playerStates[playerId]

    if (playerState.hasBusted || playerState.hasStayed) {
        return { roundOver: isRoundOver(round) }
    }

    computeRoundScore(playerState)
    playerState.hasStayed = true
    removeFromActive(round, playerId)

    return { roundOver: isRoundOver(round) }
}

/**
 * Avance currentPlayerIndex au prochain joueur encore actif.
 * Les joueurs bustés et stayed sont ignorés.
 *
 * @param {Round}    round
 * @param {Player[]} players - Liste complète des joueurs (ordre original)
 */
export function advanceToNextPlayer(round, players) {
    const total = players.length
    let next = (round.currentPlayerIndex + 1) % total

    for (let i = 0; i < total; i++) {
        const playerId = players[next % total].id
        if (round.activePlayerIds.includes(playerId)) {
            round.currentPlayerIndex = next % total
            return
        }
        next++
    }
}


/**
 * Phase SCORING : pousse les cartes des joueurs dans discardPile,
 * calcule les scores cumulés et passe la phase à SCORING.
 *
 * @param {Round}     round
 * @param {GameState} gameState
 */
export function finalizeRound(round, gameState) {
    round.phase = RoundPhase.SCORING

    for (const playerState of Object.values(round.playerStates)) {
        round.discardPile.push(...playerState.cards)
        updateCumulativeScores(playerState, gameState)
    }
}

/**
 * Phase ENDED : évalue la victoire, marque la partie terminée si un gagnant
 * est trouvé, sinon prépare le round suivant en faisant tourner le dealer.
 *
 * Cas d'égalité (winners.length > 1) : une manche supplémentaire est jouée,
 * la partie ne se termine pas encore.
 *
 * @param {GameState} gameState
 * @returns {{ gameOver: boolean, winners: string[] }}
 */
export function closeRound(gameState) {
    const round = gameState.round
    round.phase = RoundPhase.ENDED

    const winners = evaluateVictory(gameState)

    if (winners.length === 1) {
        gameState.status = GameStatus.FINISHED
        return { gameOver: true, winners }
    }

    const nextDealerIndex = (round.startingPlayerIndex + 1) % gameState.players.length
    gameState.dealerIndex = nextDealerIndex
    gameState.round = createRound(
        gameState.players,
        createDeck(),
        nextDealerIndex,
    )

    return { gameOver: false, winners }
}
