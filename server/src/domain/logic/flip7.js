import { FLIP_SEVEN_COUNT } from '../constants.js'
import {filterToNumberCards} from "../../utils/utils.js";

export function isFlipSeven(playersHand) {
  return filterToNumberCards(playersHand).length === FLIP_SEVEN_COUNT;
}

// export function isFlipSixSeven(playersHand) {
//   const values = new Set(filterToNumberCards(playersHand).map(c => c.value))
//   return values.has(6) && values.has(7)
// }
