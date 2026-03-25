import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleCreateGame } from "./socket/handlers/createGame.js";
import { handleJoinGame } from "./socket/handlers/joinGame.js";
import { handleStartGame } from "./socket/handlers/startGame.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.CLIENT_URL
      : ["http://localhost:5173", "http://10.213.175.23:5173"],
  methods: ["GET", "POST"],
};

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

const httpServer = createServer(app);
const io = new Server(httpServer, { cors: corsOptions });

// création de la socket et events liés
io.on("connection", (socket) => {
  console.log(`[socket] connected: ${socket.id}`);

  handleCreateGame(io, socket);
  handleJoinGame(io, socket);
  handleStartGame(io, socket);
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on:`);
  console.log(`  http://localhost:${PORT}`);
  console.log(`  http://10.213.175.23:${PORT}`);
});
