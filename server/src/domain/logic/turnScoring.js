import {FLIP_SEVEN_BONUS, ModifierKind} from '../constants.js'
import {filterToNumberCards, filterToModifierCards} from "../../utils/utils.js";

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
    // 1.
    if (playerState.hasBusted) {
        playerState.roundScore = 0
        return
    }

    const numberPlayerCards = filterToNumberCards(playerState.cards)
    const modifierPlayerCards = filterToModifierCards(playerState.cards)

    let score = 0

    // 2.
    for (const card of numberPlayerCards) {
        score = score + card.value
    }
    
    // 3.
    for (const card of modifierPlayerCards) {
        if (card.value === ModifierKind.X2) continue
        const bonus = parseInt(card.value, 10)
        if (!isNaN(bonus)) score += bonus
    }
    
    // 4.
    if (modifierPlayerCards.some(c => c.value === ModifierKind.X2)) {
        score *= 2
    }

    // 5.
    if (playerState.hasFlipSeven) {
        score += FLIP_SEVEN_BONUS
    }

    playerState.roundScore = score
}
