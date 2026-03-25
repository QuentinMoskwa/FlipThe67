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
 * Vérifie si le round est terminé.
 * Le round se termine quand :
 *  - plus aucun joueur n'est actif (tous bustés ou stayed)
 *  - ou un joueur a réussi le Flip 7 (déjà retiré des actifs dans processSlay)
 *
 * @param {Round} round
 * @returns {boolean}
 */
export function isRoundOver(round) {
    return round.activePlayerIds.length === 0
}
