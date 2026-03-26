import { createPlayer, createGameState } from "../../domain/factories.js";
import { setGame } from "../utils/gameStorage.js";
import { broadcastGameState } from "../utils/broadcast.js";

// 4 caractères uppercase alphanumériques (sans O/0/I/1 pour la lisibilité)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const CODE_LENGTH = 5
const MAX_ATTEMPTS = 20

function generateGameCode() {
  let code = ''
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_CHARS.charAt(Math.floor(Math.random() * CODE_CHARS.length))
  }
  return code
}

function generateUniqueCode() {
  for (let i = 0; i < MAX_ATTEMPTS; i++) {
    const code = generateGameCode()
    if (!getGame(code)) return code
  }
  throw new Error('Impossible de générer un code unique après ' + MAX_ATTEMPTS + ' tentatives')
}

export function handleCreateGame(io, socket) {
  socket.on("create-game", ({ playerName }) => {
    const host = createPlayer(playerName, socket.id);
    const game = createGameState([host]);

    game.id = generateUniqueCode();
    game.hostId = host.id;

    setGame(game.id, game);
    socket.join(game.id);
    socket.data.gameId = game.id;
    socket.data.playerId = host.id;

    socket.emit("game-created", { gameId: game.id, playerId: host.id });
    broadcastGameState(io, game.id);

    console.log(`[create-game] ${playerName} created game ${game.id}`);
  });
}
