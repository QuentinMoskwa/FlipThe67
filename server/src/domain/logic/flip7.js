import { CardType, FLIP_SEVEN_COUNT } from '../constants.js'

export function isFlipSeven(playersHand) {
  if (playersHand.length !== FLIP_SEVEN_COUNT) return false
  
  return true
}

// export function isFlipSixSeven(playersHand) {
//   const values = new Set(filterToNumberCards(playersHand).map(c => c.value))
//   return values.has(6) && values.has(7)
// }