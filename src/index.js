require('dotenv').config({ path: './.env.local' });
const logger = require("./config/logging").getLogger("PORTGIG");
const { auth } = require("./config/middlewares");
const express = require("express");
const cors = require("cors");
const database = require("./config/database");
const hpp = require("hpp");
const useragent = require("express-useragent");
const PORT = process.env.PORT || 5007;
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const fs = require("fs");

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// Initialize Socket.io with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "x-client-key",
      "x-client-token",
      "x-client-secret",
    ],
    credentials: true,
  },
});

// Store connected users
// TODO
// 1. make online users to be data stored online
const onlineUsers = new Map();

// Socket.io event handlers
io.on("connection", (socket) => {
  console.log(`[CONNECTED] Socket ID: ${socket.id}`);
  socket.on("register", (data) => {
    const userId = data.data;
    console.log(`[REGISTER] User ${userId} with socket ${socket.id}`);
    onlineUsers.set(userId, socket.id);
    console.log("[ONLINE USERS]", Array.from(onlineUsers.keys()));
  });
  socket.on("private-message", (payload) => {
    console.log("[INCOMING MESSAGE]", payload);
    const { to, message } = payload.data;

    const from = [...onlineUsers.entries()].find(
      ([_, socketId]) => socketId === socket.id
    )?.[0];

    if (!from) {
      console.log("[ERROR] Sender not registered!");
      return;
    }
    const recipientSocketId = onlineUsers.get(to);

    if (recipientSocketId) {
      console.log(`[ROUTING] From ${from} → ${to}: ${message}`);
      io.to(recipientSocketId).emit("private-message", {
        from,
        message,
        timestamp: Date.now(),
      });
    } else {
      console.log(`[OFFLINE] User ${to} not connected`);
    }
  });

  socket.on("disconnect", () => {
    const userId = [...onlineUsers.entries()].find(
      ([_, socketId]) => socketId === socket.id
    )?.[0];

    if (userId) {
      onlineUsers.delete(userId);
      console.log(`[DISCONNECTED] User ${userId} offline`);
    }
  });
});

// In src/index.js
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));
// Express middleware configuration
app.set('trust proxy', 1);
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "x-client-key",
      "x-client-token",
      "x-client-secret",
    ],
    credentials: true,
    optionsSuccessStatus: 200,
  })
);
app.use(express.urlencoded({ extended: true }));
app.use(hpp());
app.use(useragent.express());
app.use(express.json({ limit: "10mb" }));
app.use(express.static(path.join(__dirname, "../client")));

// Authentication middleware
app.use(
  auth({
    allowRoutes: [
      "/api/v1/creator/login",
      "/api/v1/creator/bio-login",
      "/api/v1/creator/register",
      "/api/v1/creator/request-password-reset",
      "/api/v1/creator/validate-registration-otp",
      "/api/v1/creator/resend-otp",
      "/api/v1/creator/reset-password",
      "/api/v1/creator/profile-views/",
      "/api/v1/creator/social-clicks/",
      "/api/v1/recruiter/login",
      "/api/v1/recruiter/bio-login",
      "/api/v1/recruiter/register",
      "/api/v1/recruiter/request-password-reset",
      "/api/v1/recruiter/validate-registration-otp",
      "/api/v1/recruiter/resend-otp",
      "/api/v1/recruiter/reset-password",
      "/api/v1/register",
      "/api/v1/online-users",
      "/api/v1/waitlist/subscribe",
      "/api/v1/waitlist/get-subscribers",
      "/api/v1/waitlist/remove-subscribers",
      "/api/v1/waitlist/sends-to-subscribers",
      "/api/v1/waitlist/send-email",
      "/api/v1/states",
      "/api/v1/fields",
      "/api/v1/user/auth/google/callback",
      "/api/v1/user/auth/google",
      "/api/v1/user/me",
      "/google",
      "/uploads/portfolio",
      "/creator/upload-portfolio-files"
    ],
  })
);

// Routes
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "index.html"));
});

app.get("/google", (req, res) => {
  res.sendFile(path.join(__dirname, "../client", "google.html"));
});

app.post("/api/v1/register", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).send("User ID required");

  // Simulate WebSocket registration
  onlineUsers.set(userId, `simulated-${Date.now()}`);
  res.status(200).send("Registration simulated");
});

app.get("/api/v1/online-users", (req, res) => {
  res.json(Array.from(onlineUsers.keys()));
});

app.get("/api/v1/states", (req, res) => {
  const { state } = req.query;

  if (state) {
    const lgas = database.getLGAsByState(state);
    if (lgas) {
      return res.json({ state, lgas });
    } else {
      return res.status(404).json({ error: "State not found" });
    }
  }

  const states = database.getAllStates();
  res.json({ states });
});

app.get("/api/v1/fields", (req, res) => {
  const { field } = req.query;

  if (field) {
    const industries = database.getIndustriesByField(field);
    if (industries) {
      return res.json({ field, industries });
    } else {
      return res.status(404).json({ error: "Field not found" });
    }
  }

  const fields = database.getAllFields();
  res.json({ fields });
});

const creatorRoute = require("./creators/creators-route");
const recruiterRoute = require("./recruiters/recruiters-route");
const jobRoute = require("./job/job-route");
const waitlistRoute = require("./waitlist/waitlist-route");
const userRoute = require("./user/user-route");

app.use("/api/v1/creator", creatorRoute);
app.use("/api/v1/recruiter", recruiterRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/waitlist", waitlistRoute);
app.use("/api/v1/user", userRoute);

async function mainApp() {
  try {
    await database.connect();
    console.log("====== Database connected !!! ======");

    server.listen(PORT, () => {
      logger.info(`🚀 APP: Started On ${PORT}`);
    });

    console.log("====== Portgig is Up And Running !!! ======");
    // database.migrateProfileViews();

    process.on("unhandledRejection", (err) => {
      logger.error("[unhandledRejection], Shutting down server now ... ");
      logger.error(err);
      throw err;
    });

    process.on("uncaughtException", (err) => {
      logger.error(
        "[uncaughtException], Shutting down server now on uncaughtException ... "
      );
      logger.error(err);
      throw err;
    });
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
}

// Start the application
mainApp();
