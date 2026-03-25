import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createServer } from "http";
import { Server } from "socket.io";
import { handleCreateGame } from "./socket/handlers/createGame.js";
import { handleJoinGame } from "./socket/handlers/joinGame.js";
import { handleStartGame } from "./socket/handlers/startGame.js";
import { handlePlayerAction } from "./socket/handlers/playerAction.js";
import { handleTargetPlayer } from "./socket/handlers/targetPlayer.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

const corsOptions = {
  origin: ["http://localhost:5173", process.env.CORS_ORIGIN],
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
  handlePlayerAction(io, socket);
  handleTargetPlayer(io, socket);
});

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`Server listening on:`);
  console.log(`  http://localhost:${PORT}`);
});
