import { filterToNumberCards } from "../utils/utils.js";
import {FLIP_SEVEN_COUNT} from "../constants.js";

export function isBust(playerState) {
    const numberPlayerCards = filterToNumberCards(playerState.cards)

    const uniqueCards = new Set()
    numberPlayerCards.forEach(card => {
        uniqueCards.add(card.value)
    })

    if (uniqueCards.size !== numberPlayerCards.length) {
        applyBust(playerState)
    }

}

function applyBust(playerState) {
    if (playerState.hasSecondChance) {
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
