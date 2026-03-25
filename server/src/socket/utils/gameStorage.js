const games = new Map();

export const getGame = (id) => games.get(id) ?? null;
export const setGame = (id, game) => games.set(id, game);
export const deleteGame = (id) => games.delete(id);
