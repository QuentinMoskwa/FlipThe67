import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// CORS explicite — autorise uniquement Vite en dev
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' ? process.env.CLIENT_URL : 'http://localhost:5173',
  methods: ['GET', 'POST'],
}

app.use(cors(corsOptions))
app.use(express.json())

// Route de santé
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'Server is healthy' })
})

app.listen(PORT, () => {
  console.log(`Serveur sur http://localhost:${PORT}`)
})