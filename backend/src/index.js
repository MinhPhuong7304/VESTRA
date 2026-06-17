const express = require("express");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const authRoutes = require('./routes/authRoutes');
const tryOnRoutes = require('./routes/tryOnRoutes');
const threeDRoutes = require('./routes/threeDRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));

// --- SOCKET.IO FOR REAL-TIME CHAT ---
const io = new Server(server, {
  cors: {
    origin: "*", // Cho phép mọi Frontend kết nối
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("⚡ User Connected:", socket.id);

  // 1. Tham gia phòng chat
  socket.on("join_room", (chatId) => {
    if (chatId) {
      socket.join(chatId);
      console.log(`User ${socket.id} joined room: ${chatId}`);
    }
  });

  // 2. Nhận và phát tin nhắn
  socket.on("send_message", (data) => {
    console.log("📩 New Message:", data);
    socket.to(data.chat_id).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

// ĐĂNG KÝ ROUTER
app.use("/auth", authRoutes);
app.use("/api/auth", authRoutes);

app.use("/api", tryOnRoutes);
app.use("/", tryOnRoutes);

app.use("/api", threeDRoutes);
app.use("/", threeDRoutes);

app.get('/', (req, res) => {
  res.send('Server Backend Vestra TMĐT & Blockchain Ledger đang chạy (JWT + WebSocket Enabled)');
});

// Middleware xử lý lỗi tập trung
app.use(errorHandler);

// Listen to port (from .env or fallback)
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server Vestra đang chạy tại: http://localhost:${PORT}`);
});
