import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SERVER_URL = import.meta.env.VITE_SERVER_URL || "http://localhost:3001";
const STORAGE_KEY = "slayGameSession";

function loadSession() {
  try {
    const session = localStorage.getItem(STORAGE_KEY);
    return session ? JSON.parse(session) : null;
  } catch (e) {
    console.error("Failed to load session:", e);
    return null;
  }
}

function saveSession(gameId, playerId) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ gameId, playerId }));
  } catch (e) {
    console.error("Failed to save session:", e);
  }
}

function clearSession() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error("Failed to clear session:", e);
  }
}

// ─── Singleton ────────────────────────────────────────────────
// On crée la connexion une seule fois au niveau du module.
// Tous les composants qui appellent useSocket() partagent la même instance.
let _socket = null;

function getSocket() {
  if (!_socket) {
    _socket = io(SERVER_URL, { autoConnect: true });
  }
  return _socket;
}

export function useSocket() {
  const socket = getSocket();
  const [connected, setConnected] = useState(socket.connected);

  useEffect(() => {
    const onConnect = () => {
      console.log("[useSocket] Connected, attempting auto-reconnect if needed");
      setConnected(true);

      // Tenter une reconnexion automatique si on a une session stockée
      const session = loadSession();
      if (session?.gameId && session?.playerId) {
        console.log("[useSocket] Found stored session, attempting reconnect");
        socket.emit("player-reconnect", {
          gameId: session.gameId,
          playerId: session.playerId,
        });
      }
    };

    const onDisconnect = () => {
      console.log("[useSocket] Disconnected");
      setConnected(false);
    };

    // Écouter la reconnexion réussie
    const onReconnectSuccess = ({ gameId, playerId }) => {
      console.log("[useSocket] Reconnect successful");
      saveSession(gameId, playerId);
    };

    const onReconnectFailed = ({ message }) => {
      console.warn("[useSocket] Reconnect failed:", message);
      clearSession();
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("reconnect-success", onReconnectSuccess);
    socket.on("reconnect-failed", onReconnectFailed);

    // Synchroniser l'état initial si le socket est déjà connecté
    setConnected(socket.connected);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("reconnect-success", onReconnectSuccess);
      socket.off("reconnect-failed", onReconnectFailed);
    };
  }, [socket]);

  const emit = (event, data) => socket.emit(event, data);
  const on = (event, cb) => socket.on(event, cb);
  const off = (event, cb) => socket.off(event, cb);

  const savePlayerSession = (gameId, playerId) => {
    saveSession(gameId, playerId);
  };

  const clearPlayerSession = () => {
    clearSession();
  };

  return {
    socket,
    connected,
    emit,
    on,
    off,
    savePlayerSession,
    clearPlayerSession,
  };
}
