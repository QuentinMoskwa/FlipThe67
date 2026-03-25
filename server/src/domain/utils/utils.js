import {CardType} from "../constants.js";

export function filterToNumberCards(cards) {
    return cards.filter(c => c.type === CardType.NUMBER)
}

export function filterToModifierCards(cards) {
    return cards.filter(c => c.type === CardType.MODIFIER)
}

/**
 * Retourne les IDs des joueurs encore actifs dans le round,
 * en excluant optionnellement un joueur (ex : le joueur courant).
 *
 * @param {Round} round
 * @param {string} [excludePlayerId]
 * @returns {string[]}
 */
export function getActivePlayerIds(round, excludePlayerId) {
    return round.activePlayerIds.filter(id => id !== excludePlayerId)
}

/**
 * Retire un joueur de la liste des joueurs actifs du round.
 * Mute activePlayerIds directement.
 *
 * @param {Round} round
 * @param {string} playerId
 */
export function removeFromActive(round, playerId) {
    const index = round.activePlayerIds.indexOf(playerId)
    if (index !== -1) round.activePlayerIds.splice(index, 1)
}

/**
 * Retourne les joueurs dans l'ordre de jeu à partir du startingPlayerIndex.
 * Exemple : players=[A,B,C,D], startingPlayerIndex=2 → [C,D,A,B]
 *
 * @param {Player[]} players
 * @param {number}   startingPlayerIndex
 * @returns {Player[]}
 */
export function getOrderedPlayers(players, startingPlayerIndex) {
    const ordered = []

    for (let i = 0; i < players.length; i++) {
        const index = (startingPlayerIndex + i) % players.length
        ordered.push(players[index])
    }

    return ordered
}