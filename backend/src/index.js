const express = require("express");
const path = require("path");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const authRoutes = require('./routes/authRoutes');
const tryOnRoutes = require('./routes/tryOnRoutes');
const threeDRoutes = require('./routes/threeDRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const addressRoutes = require('./routes/addressRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const createResourceRouter = require('./routes/resourceRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const server = http.createServer(app);

// MIDDLEWARE
app.use(cors());
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

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

// Sản phẩm & Danh mục
app.use("/api/products", productRoutes);
app.use("/products", productRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/categories", categoryRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/upload", uploadRoutes);

// Đơn hàng & Giỏ hàng
app.use("/api/orders", orderRoutes);
app.use("/orders", orderRoutes);
app.use("/api/carts", cartRoutes);
app.use("/carts", cartRoutes);

// Người dùng, Địa chỉ & Thông báo
app.use("/api/addresses", addressRoutes);
app.use("/addresses", addressRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/notifications", notificationRoutes);

// Chatbot AI
app.use("/api", chatRoutes);
app.use("/", chatRoutes);

// Tài nguyên CRUD động (Dynamic Resource Routes)
app.use("/api/users", createResourceRouter("users"));
app.use("/users", createResourceRouter("users"));

app.use("/api/banners", createResourceRouter("banners"));
app.use("/banners", createResourceRouter("banners"));

app.use("/api/vouchers", createResourceRouter("vouchers"));
app.use("/vouchers", createResourceRouter("vouchers"));

app.use("/api/stores", createResourceRouter("stores"));
app.use("/stores", createResourceRouter("stores"));

app.use("/api/shifts", createResourceRouter("shifts"));
app.use("/shifts", createResourceRouter("shifts"));

app.use("/api/chats", createResourceRouter("chats"));
app.use("/chats", createResourceRouter("chats"));

app.use("/api/chat-messages", createResourceRouter("chat_messages"));
app.use("/chat-messages", createResourceRouter("chat_messages"));

app.use("/api/reviews", createResourceRouter("reviews"));
app.use("/reviews", createResourceRouter("reviews"));

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
