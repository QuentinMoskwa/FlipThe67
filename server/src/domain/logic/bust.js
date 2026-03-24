import { CardType } from '../constants.js'
import { filterToNumberCards, filterToModifierCards } from '../utils/utils.js'

export function isBust(playerState) {
    const numberPlayerCards = filterToNumberCards(playerState.cards)

    const uniqueCards = new Set()
    numberPlayerCards.forEach(card => {
        uniqueCards.add(card.id)
    })

    if (uniqueCards.size !== numberPlayerCards.length) {
        applyBust(playerState)
        return
    }

}

function applyBust(playerState) {
    if (playerState.hasSecondChance) {
        playerState.hasSecondChance = false
        return
    }

    playerState.hasBusted = true
    return
}