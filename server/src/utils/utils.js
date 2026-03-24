
function filterToNumberCards(cards) {
    return cards.filter(c => c.type === CardType.NUMBER)
}

function filterToModifierCards(cards) {
    return cards.filter(c => c.type === CardType.MODIFIER)
}

export const utils = {
    filterToNumberCards,
    filterToModifierCards,
}