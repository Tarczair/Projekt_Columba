require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { waf, globalLimiter } = require("./src/middleware/security");
const apiRoutes = require("./src/routes/api.routes");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5174",
    methods: ["GET", "POST"],
  },
});

app.use(waf);
app.use(globalLimiter);
app.use(cors());
app.use(express.json());
app.use(
  "/uploads",
  (req, res, next) => {
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    next();
  },
  express.static("uploads"),
);

app.use("/api", apiRoutes);

app.set("socketio", io);

io.on("connection", (socket) => {
  console.log(`Nowe połączenie socketowe: ${socket.id}`);

  socket.on("join_personal_room", (userId) => {
    socket.join(String(userId));
  });

  socket.on("join_conversation", (conversationId) => {
    if (conversationId) {
      const roomName = `room_${String(conversationId)}`;
      socket.join(roomName);
      console.log(
        `[Socket] Użytkownik ${socket.id} dołączył do pokoju: ${roomName}`,
      );
    }
  });
});

const PORT = process.env.PORT_BACKEND || 5000;

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Serwer działa na 0.0.0.0:${PORT}`);
});
