# FlipThe67 — Serveur

Serveur WebSocket du jeu de cartes **FlipThe67**, basé sur les règles de Flip 7.
Développé sans moteur de jeu, en Node.js + Express + Socket.io.

---

## Stack

| Couche | Technologie |
|---|---|
| Runtime | Node.js (ESM natif) |
| Serveur HTTP | Express |
| Temps réel | Socket.io |
| État en mémoire | `Map` (pas de base de données) |

---

## Lancer le serveur

```bash
npm install
npm run dev       # développement (nodemon)
npm start         # production
```

Variables d'environnement (`.env`) :

```
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

Endpoint de santé : `GET /api/health`

---

## Architecture

```
src/
├── index.js                    ← Bootstrap Express + Socket.io
├── domain/
│   ├── constants.js            ← Enums (CardType, ActionKind, RoundPhase…)
│   ├── factories.js            ← Classes Card, Player, Round, GameState + factories
│   ├── deck.js                 ← createDeck(), shuffle(), drawCard()
│   ├── game/
│   │   └── gameEngine.js       ← Moteur : processSlay, processStay, closeRound…
│   ├── logic/
│   │   ├── action.js           ← Résolution Freeze, FlipThree, SecondChance
│   │   ├── playerState.js      ← isBust(), isFlipSeven()
│   │   ├── scoring.js          ← computeRoundScore(), updateCumulativeScores()
│   │   └── victory.js          ← evaluateVictory()
│   └── utils/
│       └── utils.js            ← Helpers : isRoundOver, removeFromActive…
└── socket/
    ├── handlers/
    │   ├── createGame.js       ← Écoute : create-game
    │   ├── joinGame.js         ← Écoute : join-game
    │   ├── startGame.js        ← Écoute : start-game
    │   ├── playerAction.js     ← Écoute : player-action, next-round
    │   ├── targetPlayer.js     ← Écoute : target-player
    │   ├── leaveGame.js        ← Écoute : leave-game
    │   ├── reconnect.js        ← Écoute : player-reconnect
    │   └── restartGame.js      ← Écoute : restart-game
    └── utils/
        ├── broadcast.js        ← broadcastGameState(io, gameId)
        └── gameStorage.js      ← Map en mémoire des parties actives
```

---

## Modèle de données

### GameState

```js
{
  id:          string,          // Code de partie 5 chars uppercase (ex: "ABKZ7")
  status:      'waiting' | 'playing' | 'finished',
  players:     Player[],
  round:       Round | null,
  scores:      { [playerId]: number },   // Scores cumulés sur toutes les manches
  dealerIndex: number,
  hostId:      string,
}
```

### Round

```js
{
  phase:               'playing' | 'scoring' | 'ended',
  currentPlayerIndex:  number,
  startingPlayerIndex: number,
  deck:                Card[],
  discardPile:         Card[],
  activePlayerIds:     string[],
  playerStates:        { [playerId]: PlayerRoundState },
  pendingAction:       { card, sourcePlayerId } | null,
}
```

### PlayerRoundState

```js
{
  playerId:        string,
  cards:           Card[],
  hasBusted:       boolean,
  hasStayed:       boolean,
  hasFrozen:       boolean,   // gelé par un Freeze adverse
  hasFlipSeven:    boolean,
  hasSecondChance: boolean,
  roundScore:      number,
}
```

---

## Événements Socket.io

### Client → Serveur

| Événement | Payload | Description |
|---|---|---|
| `create-game` | `{ playerName }` | Créer une partie |
| `join-game` | `{ gameId, playerName }` | Rejoindre une partie |
| `start-game` | `{ gameId }` | Démarrer (host uniquement) |
| `player-action` | `{ gameId, action: 'slay'\|'stay' }` | Action de jeu |
| `target-player` | `{ gameId, targetPlayerId }` | Choisir une cible (Freeze/FlipThree) |
| `next-round` | `{ gameId }` | Lancer la manche suivante (host) |
| `leave-game` | `{ gameId }` | Quitter la partie |
| `player-reconnect` | `{ gameId, playerId }` | Se reconnecter après un refresh |
| `restart-game` | `{ gameId }` | Rejouer (host) |

### Serveur → Client

| Événement | Payload | Description |
|---|---|---|
| `game-created` | `{ gameId, playerId }` | Partie créée |
| `game-joined` | `{ playerId }` | Partie rejointe |
| `game-state-update` | `GameState` | Broadcast après chaque action |
| `game-started` | `GameState` | La partie commence |
| `card-drawn` | `{ playerId, playerName, card, result }` | Révélation de la carte piochée |
| `action-requires-target` | `{ card, availableTargets }` | Choix de cible requis |
| `game-finished` | `{ winners }` | Fin de partie |
| `reconnect-success` | `{ gameId, playerId }` | Reconnexion réussie |
| `reconnect-failed` | `{ message }` | Reconnexion échouée |
| `left-game` | `{ success }` | Joueur sorti |
| `error` | `{ message }` | Erreur métier |

---

## Flow de jeu

```
create-game / join-game
        ↓
   start-game  →  game-started + game-state-update
        ↓
   player-action (slay)
     ├─ needsTarget → action-requires-target
     │       ↓
     │   target-player → résolution + game-state-update
     │
     ├─ roundOver → SCORING (game-state-update) → RoundSummary
     │       ↓ (host clique "manche suivante")
     │   next-round → évalue victoire
     │     ├─ gameOver → game-finished
     │     └─ sinon   → game-state-update (nouveau round)
     │
     └─ normal → advanceToNextPlayer → game-state-update
```

---

## Règles implémentées

**Deck** — 94 cartes : 79 numérotées (valeur N × N exemplaires, sauf 0 = 1), 6 modificateurs (×2, +2, +4, +6, +8, +10), 9 cartes action (Freeze×3, FlipThree×3, SecondChance×3).

**Bust** — piocher un doublon de carte numérotée → score 0 pour la manche. La carte causant le bust est retirée de la main et défaussée.

**Flip 7** — aligner 7 cartes numérotées uniques → fin immédiate + bonus +15 pts (non multiplié par ×2).

**SecondChance** — annule le prochain bust. La carte SC et la carte bust sont toutes deux défaussées.

**Freeze** — la cible banke ses points et sort du round (`hasFrozen = true`, distinct de `hasStayed`).

**FlipThree** — la cible pioche 3 cartes de force. Chaque carte peut causer un bust ou déclencher un Flip 7 en cours de tirage.

**Calcul du score** (ordre strict) : somme des nombres → modificateurs additifs → ×2 → bonus Flip 7.

**Victoire** — premier à atteindre 200 pts. En cas d'égalité, manche supplémentaire jusqu'à un seul gagnant.
