/**
 * @fileoverview Constantes du domaine Flip 7.
 * Tous les objets sont gelés (Object.freeze) pour éviter
 * toute mutation accidentelle à l'exécution.
 */

/**
 * Discriminant des sous-types de cartes.
 * @enum {string}
 */
export const CardType = Object.freeze({
    NUMBER:   'number',
    ACTION:   'action',
    MODIFIER: 'modifier',
})

/**
 * Actions possibles pour une ActionCard.
 * @enum {string}
 */
export const ActionKind = Object.freeze({
    FREEZE:        'freeze',
    FLIP_THREE:    'flipThree',
    SECOND_CHANCE: 'secondChance',
})

/**
 * Modificateurs possibles pour une ModifierCard.
 * @enum {string}
 */
export const ModifierKind = Object.freeze({
    X2:   'x2',
    PLUS2: '+2',
    PLUS4: '+4',
    PLUS6: '+6',
    PLUS8: '+8',
    PLUS10: '+10',
})

/**
 * Phases possibles d'un round.
 * - dealing  : distribution initiale d'une carte par joueur
 * - playing  : les joueurs jouent à tour de rôle (hit / stay)
 * - scoring  : calcul et affichage des scores de la manche
 * - ended    : la manche est terminée, en attente de la suivante
 * @enum {string}
 */
export const RoundPhase = Object.freeze({
    DEALING: 'dealing',
    PLAYING: 'playing',
    SCORING: 'scoring',
    ENDED:   'ended',
})

/**
 * Statuts possibles d'une partie.
 * @enum {string}
 */
export const GameStatus = Object.freeze({
    WAITING:  'waiting',
    PLAYING:  'playing',
    FINISHED: 'finished',
})

/**
 * Score à atteindre pour déclencher la fin de partie.
 * @type {number}
 */
export const WINNING_SCORE = 200

/**
 * Nombre de cartes uniques à aligner pour obtenir le bonus Flip 7.
 * @type {number}
 */
export const FLIP_SEVEN_COUNT = 7

/**
 * Points bonus accordés pour un Flip 7 réussi.
 * @type {number}
 */
export const FLIP_SEVEN_BONUS = 15
