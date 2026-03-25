import { filterToNumberCards } from "../utils/utils.js";
import {ActionKind, CardType, FLIP_SEVEN_COUNT} from "../constants.js";

export function isBust(playerState,discardPile) {
    const numberPlayerCards = filterToNumberCards(playerState.cards)

    const uniqueCards = new Set()
    numberPlayerCards.forEach(card => {
        uniqueCards.add(card.value)
    })

    if (uniqueCards.size !== numberPlayerCards.length) {
        applyBust(playerState, discardPile)
    }

}

function applyBust(playerState, discardPile) {
    if (playerState.hasSecondChance) {
        const scIndex = playerState.cards.findIndex(
            c => c.type === CardType.ACTION && c.value === ActionKind.SECOND_CHANCE
        )
        if (scIndex !== -1) {
            discardPile.push(playerState.cards.splice(scIndex, 1)[0])
        }

        playerState.hasSecondChance = false
        return
    }

    playerState.hasBusted = true
}

export function isFlipSeven(playersHand) {
    return filterToNumberCards(playersHand).length === FLIP_SEVEN_COUNT;
}

// export function isFlipSixSeven(playersHand) {
//   const values = new Set(filterToNumberCards(playersHand).map(c => c.value))
//   return values.has(6) && values.has(7)
// }
