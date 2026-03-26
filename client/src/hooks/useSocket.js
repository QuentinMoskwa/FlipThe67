import { useEffect, useState, useMemo } from 'react'
import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001'

// ─── Singleton ────────────────────────────────────────────────
// On crée la connexion une seule fois au niveau du module.
// Tous les composants qui appellent useSocket() partagent la même instance.
let _socket = null

function getSocket() {
  if (!_socket) {
    _socket = io(SERVER_URL, { autoConnect: true })
  }
  return _socket
}

export function useSocket() {
  const socket = getSocket()
  const [connected, setConnected] = useState(socket.connected)

  useEffect(() => {
    const onConnect    = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on('connect',    onConnect)
    socket.on('disconnect', onDisconnect)

    // Synchroniser l'état initial si le socket est déjà connecté
    setConnected(socket.connected)

    return () => {
      socket.off('connect',    onConnect)
      socket.off('disconnect', onDisconnect)
    }
  }, [socket])

  // ── Stabiliser emit / on / off ────────────────────────────
  // Sans useMemo, ces arrow functions sont recréées à chaque render.
  // Comme elles finissent dans des deps de useEffect, ça provoquerait
  // un cleanup + re-registration de listeners à chaque setState — race
  // condition si un event arrive pendant le gap entre les deux.
  const { emit, on, off } = useMemo(() => ({
    emit: (event, data) => socket.emit(event, data),
    on:   (event, cb)   => socket.on(event, cb),
    off:  (event, cb)   => socket.off(event, cb),
  }), [socket])  // socket est le singleton → référence stable → memo jamais recalculé

  return { socket, connected, emit, on, off }
}
