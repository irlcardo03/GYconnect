'use client'

import { io, Socket } from 'socket.io-client'

let socket: Socket | null = null

export function getSocket(): Socket {
  if (!socket) {
    socket = io('/?XTransformPort=3003', {
      transports: ['websocket', 'polling'],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 1000,
    })
  }
  return socket
}

export function connectSocket(profileId: string) {
  const s = getSocket()
  if (!s.connected) {
    s.connect()
    s.on('connect', () => {
      s.emit('auth', { profileId })
    })
  }
  return s
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
