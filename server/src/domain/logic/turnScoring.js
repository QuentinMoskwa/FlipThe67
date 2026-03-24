import { CardType, ModifierKind, FLIP_SEVEN_BONUS } from '../constants.js'
import { isBust } from './bust.js'
import { isFlipSeven } from './flip7.js'
import { filterToNumberCards, filterToModifierCards } from '../utils/utils.js'

/**
 * Calcule le score d'un joueur après qu'il ait piochée.
 *
 * Ordre d'application :
 * 1. Check si joueur a busté sinon score 0 
 * 2. Check si Flip 67 (bonus a déterminer)
 * 3. Somme des cartes numérotées
 * 4. Modificateurs additifs (+2 … +10)
 * 5. Modificateur ×2 — appliqué en dernier ()
 * 6. Check si Flip 7 (car pas de x2 sur le bonus Flip 7)
 */
export function computeRoundScore(playerState) {
    const playersCards = playerState.cards
    const numberPlayerCards = filterToNumberCards(playersCards)
    const modifierPlayerCards = filterToModifierCards(playersCards)
    // 1.
    if (playerState.hasBusted) return 0

    // 2.


    // 3.
    let score = 0

    for (const card of numberPlayerCards) {
        score = score + card.value
    }
    
    // 4.
    for (const card of modifierPlayerCards) {
        if (card.value === ModifierKind.X2) continue
        const bonus = parseInt(card.value, 10)
        if (!isNaN(bonus)) score += bonus
    }
    
    // 5.
    if (modifierPlayerCards.some(c => c.value === ModifierKind.X2)) {
        score *= 2
    }
    playerState.roundScore = score
}