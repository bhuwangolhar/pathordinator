require("dotenv").config();

const express = require("express");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const db = require("../models");

const authRoutes = require("./routes/auth.routes");
const organizationRoutes = require("./routes/organization.routes");
const userRoutes = require("./routes/user.routes");
const orderRoutes = require("./routes/order.routes");
const deliverySessionRoutes = require("./routes/deliverySessions.routes");
const locationUpdateRoutes  = require("./routes/locationUpdates.routes");

const app = express();
const httpServer = http.createServer(app);

// CORS configuration
const corsOrigin = process.env.CORS_ORIGIN || "*";
const corsOptions = {
  origin: corsOrigin,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
};

const io = socketIo(httpServer, {
  cors: corsOptions
});

// Store io instance globally so controllers can use it
global.io = io;

app.use(cors(corsOptions));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    service: "Pathordinator API",
    status: "running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/organizations", organizationRoutes);
app.use("/api/users", userRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/delivery-sessions", deliverySessionRoutes);
app.use("/api/location-updates",  locationUpdateRoutes);

const PORT = Number(process.env.PORT) || 8080;

// WebSocket event handlers
io.on("connection", (socket) => {
  if (process.env.NODE_ENV !== 'production') console.log(`User connected: ${socket.id}`);

  socket.on("join-organization", (organizationId) => {
    const roomName = `org-${organizationId}`;
    socket.join(roomName);
    if (process.env.NODE_ENV !== 'production') console.log(`User ${socket.id} joined organization room: ${roomName}`);
  });

  socket.on("track-delivery", (deliverySessionId, organizationId) => {
    const roomName = `delivery-${deliverySessionId}`;
    socket.join(roomName);
    if (process.env.NODE_ENV !== 'production') console.log(`User ${socket.id} tracking delivery: ${roomName}`);
  });

  socket.on("start-delivery", (userId, organizationId) => {
    const roomName = `user-online-${userId}`;
    socket.join(roomName);
    if (process.env.NODE_ENV !== 'production') console.log(`User ${userId} started delivery session`);
    // Broadcast to organization that this user is online
    io.to(`org-${organizationId}`).emit("user-online", { 
      userId, 
      status: true,
      timestamp: new Date()
    });
  });

  socket.on("disconnect", () => {
    if (process.env.NODE_ENV !== 'production') console.log(`User disconnected: ${socket.id}`);
  });
});

async function startServer() {
  try {
    console.log("🔍 ENV:", process.env.NODE_ENV);
    console.log("🔍 DB URL present:", !!process.env.DATABASE_URL);

    await db.sequelize.authenticate();
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ DB connection failed:", error);
  }

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🔌 WebSocket server initialized`);
  });
}

startServer();
