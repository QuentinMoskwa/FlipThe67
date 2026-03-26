# FlipThe67 — Client

Interface jouable du jeu de cartes **FlipThe67**.
React + Vite, communication temps réel via Socket.io.

---

## Stack

| Couche | Technologie |
|---|---|
| UI | React 18 |
| Build | Vite |
| Temps réel | Socket.io client |
| Style | CSS modules scoped + custom properties |

---

## Lancer le client

```bash
npm install
npm run dev
```

Variable d'environnement (`.env`) :

```
VITE_SERVER_URL=http://localhost:3001
```

---

## Architecture

```
src/
├── App.jsx                         ← Machine d'états : lobby → game → roundSummary → victory
├── index.css                       ← Tokens CSS globaux + 4 thèmes
├── hooks/
│   ├── useSocket.js                ← Singleton Socket.io (connexion unique partagée)
│   ├── useCardCanvas.js            ← Canvas animé (particules 6/7)
│   └── useTheme.js                 ← Gestion du thème (localStorage + data-theme)
└── components/
    ├── lobby/
    │   ├── Lobby.jsx               ← Accueil, création/rejoindre une partie, salle d'attente
    │   └── Lobby.css
    ├── gameBoard/
    │   ├── GameBoard.jsx           ← Plateau de jeu principal (layout boussole)
    │   └── GameBoard.css
    ├── playerArea/
    │   ├── PlayerArea.jsx          ← Zone d'un joueur : cartes + barre d'info
    │   └── PlayerArea.css
    ├── card/
    │   ├── Card.jsx                ← Composant carte avec flip animation
    │   └── Card.css
    ├── targetModal/
    │   ├── TargetModal.jsx         ← Choix de cible pour Freeze / FlipThree
    │   └── TargetModal.css
    ├── drawnCardReveal/
    │   ├── DrawnCardReveal.jsx     ← Révélation animée de la carte piochée
    │   └── DrawnCardReveal.css
    ├── roundSummary/
    │   ├── RoundSummary.jsx        ← Récap de fin de manche
    │   └── RoundSummary.css
    ├── victory/
    │   ├── Victory.jsx             ← Écran de victoire avec classement final
    │   └── Victory.css
    ├── themePicker/
    │   ├── ThemePicker.jsx         ← Sélecteur de thème (popover)
    │   └── ThemePicker.css
    └── iconButton/
        ├── IconButton.jsx          ← Bouton icône générique réutilisable
        └── IconButton.css
```

---

## Machine d'états (App.jsx)

```
'lobby'  ──[game-started]──────────────→  'game'
                                              │
                              [round.phase = scoring]
                                              ↓
                                       'roundSummary'
                                              │
                              [next-round → phase = playing]
                                              ↓
                                          'game'
                                              │
                                    [game-finished]
                                              ↓
                                        'victory'
                                              │
                                      [onLobby()]
                                              ↓
                                          'lobby'
```

Les transitions sont pilotées par `game-state-update` (sur `round.phase`) et `game-finished`.

---

## Connexion Socket.io

`useSocket.js` expose un **singleton** — la connexion est créée une seule fois au niveau module, peu importe combien de composants appellent le hook.

```js
const { emit, on, off, connected } = useSocket()
```

`on` et `off` sont stabilisés via `useMemo` pour ne pas provoquer de re-registration de listeners à chaque render.

---

## Thèmes

4 thèmes définis dans `index.css`, sélectionnables depuis le Lobby :

| ID | Nom | Ambiance |
|---|---|---|
| `ocean` | Ocean | Bleu nuit (défaut) |
| `aqua` | Aqua | Teal/canard |
| `shrek` | Shrek | Vert sauge |
| `retro` | Retro | Rouge/brique |

Le thème est persisté dans `localStorage` sous la clé `flip67-theme` et appliqué via `data-theme` sur `<html>`. Tous les composants utilisent des `var(--slate)`, `var(--bg)`, etc. — aucun hardcode de couleur hors badges sémantiques (bust/flip7/frozen/stayed).

Pour ajouter un thème : ajouter une entrée dans `THEMES` dans `useTheme.js` et le bloc `[data-theme="id"]` correspondant dans `index.css`.

---

## Layout du plateau (GameBoard)

Le plateau utilise un CSS Grid en croix :

```
       [top]
[left] [center] [right]
      [bottom]
```

Le joueur local est **toujours en bas**. Les autres joueurs sont répartis selon leur nombre :

| Joueurs | Disposition |
|---|---|
| 2 joueurs | bottom + top |
| 3 joueurs | bottom + top + right |
| 4 joueurs | bottom + top + left + right |

Les joueurs latéraux (left/right) ont leur `PlayerArea` pivotée à ±90°.

---

## Composants notables

### `Card.jsx`
Gère le flip 3D (CSS `rotateY`). Normalise les valeurs d'action du serveur (`flipThree` → `flip3`, `secondChance` → `secondChance`) en interne — les appelants passent les cartes brutes.

### `DrawnCardReveal`
Affiché à tous les joueurs après chaque Slay. Séquence : face cachée → flip (250ms) → label contextuel (BUST / FLIP 7! / ACTION) → fade out (1100ms).

### `TargetModal`
Affiché uniquement sur le client qui doit choisir une cible pour Freeze ou FlipThree. Les autres joueurs voient l'état "action en cours" via le banner.

### `PlayerArea`
Statuts possibles : `active` / `stayed` / `frozen` (gelé par Freeze, distinct de stayed) / `busted` / `flip7`. Les joueurs inactifs (stayed/frozen/busted) sont grisés à 35% avec filtre grayscale.

### `IconButton`
Bouton icône générique `40×40px`. Base réutilisable pour ThemePicker, bouton règles, etc. Le positionnement (fixed, coordonnées) est laissé au composant parent.

---

## Reconnexion

Si un joueur refresh sa page, son `playerId` est lu depuis `localStorage` et émis via `player-reconnect`. Le serveur réassocie le socket et renvoie le `gameState` complet.

```js
// Stocké à la connexion initiale
localStorage.setItem('flip67-playerId', playerId)
localStorage.setItem('flip67-gameId', gameId)
```
