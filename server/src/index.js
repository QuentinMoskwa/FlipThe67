import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { createServer } from 'http'
import { Server } from 'socket.io'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173',
  methods: ['GET', 'POST'],
}

app.use(cors(corsOptions))
app.use(express.json())

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Server is healthy' })
})

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: corsOptions,
})

io.on('connection', (socket) => {
  console.log(`[socket] connected: ${socket.id}`)

  socket.on('ping', () => {
    socket.emit('pong', { timestamp: new Date().toISOString() })
  })

  socket.on('disconnect', (reason) => {
    console.log(`[socket] disconnected: ${socket.id} — ${reason}`)
  })
})

httpServer.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`)
})