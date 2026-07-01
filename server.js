const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Allow the React client (any origin, kept simple for this assignment)
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.use(cors());
app.use(express.json());

// ---- In-memory message store (simple on purpose — swap for a DB later) ----
let messages = [];
let messageIdCounter = 1;

// Track connected users: socketId -> username
const connectedUsers = new Map();

// ---- REST API ----

// Health check
app.get("/", (req, res) => {
  res.json({ status: "Chat server is running" });
});

// Fetch full chat history (used when the app first loads)
app.get("/api/messages", (req, res) => {
  res.json(messages);
});

// Fallback REST endpoint to post a message (in case a client isn't using sockets)
app.post("/api/messages", (req, res) => {
  const { user, text } = req.body;

  if (!user || !text) {
    return res.status(400).json({ error: "user and text are required" });
  }

  const message = {
    id: messageIdCounter++,
    user,
    text,
    timestamp: new Date().toISOString(),
  };

  messages.push(message);
  io.emit("chat message", message); // broadcast to all connected sockets too
  res.status(201).json(message);
});

// ---- Socket.io real-time layer ----

io.on("connection", (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Client tells us who they are when they join
  socket.on("join", (username) => {
    connectedUsers.set(socket.id, username);
    io.emit("user list", Array.from(connectedUsers.values()));
    socket.broadcast.emit("system message", `${username} joined the chat`);
  });

  // New chat message from a client
  socket.on("chat message", ({ user, text }) => {
    if (!user || !text || !text.trim()) return;

    const message = {
      id: messageIdCounter++,
      user,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };

    messages.push(message);

    // Broadcast to everyone, including the sender, so all clients stay in sync
    io.emit("chat message", message);
  });

  // Typing indicator (nice-to-have, kept minimal)
  socket.on("typing", (username) => {
    socket.broadcast.emit("typing", username);
  });

  socket.on("disconnect", () => {
    const username = connectedUsers.get(socket.id);
    connectedUsers.delete(socket.id);
    if (username) {
      io.emit("user list", Array.from(connectedUsers.values()));
      socket.broadcast.emit("system message", `${username} left the chat`);
    }
    console.log(`Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Chat server listening on port ${PORT}`);
});
