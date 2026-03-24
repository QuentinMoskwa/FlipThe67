import { filterToNumberCards } from "../../utils/utils.js";

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
    }

    playerState.hasBusted = true
}
