require("dotenv").config({ path: "./.env.local" });
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
const multer = require("multer");

// Initialize Express and HTTP server
const app = express();
const server = http.createServer(app);

// ===== SOCKET.IO =====
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "https://portgig.com",
      "https://www.portgig.com"
    ],
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

const onlineUsers = new Map();

io.on("connection", (socket) => {
  console.log(`[CONNECTED] Socket ID: ${socket.id}`);

  socket.on("register", (data) => {
    const userId = data.data;
    onlineUsers.set(userId, socket.id);
    console.log(`[REGISTER] User ${userId} registered`);
  });

  socket.on("private-message", (payload) => {
    const { to, message } = payload.data;
    const from = [...onlineUsers.entries()].find(([_, id]) => id === socket.id)?.[0];

    if (!from) return console.log("[ERROR] Sender not registered!");

    const recipientSocketId = onlineUsers.get(to);
    if (recipientSocketId) {
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
    const userId = [...onlineUsers.entries()].find(([_, id]) => id === socket.id)?.[0];
    if (userId) onlineUsers.delete(userId);
  });
});

// ===== MIDDLEWARE =====
app.set("trust proxy", 1);
app.use(cors({
  origin: ["https://portgig.com", "https://www.portgig.com", "http://localhost:3000"],
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
  credentials: true
}));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));
app.use(hpp());
app.use(useragent.express());
app.use(express.static(path.join(__dirname, "../client")));
app.use("/uploads", express.static(path.join(__dirname, "..", "uploads")));

// ===== AUTH MIDDLEWARE =====
app.use(auth({
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
    "/api/v1/creator/profile",
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
    // "/uploads/portfolio",
    // "/creator/upload-portfolio-files",
    "/api/v1/uploads/portfolio",
    "/api/v1/creator/upload-portfolio-files"
  ]
}));

// ===== FILE UPLOAD SETUP =====
const uploadDir = path.join(__dirname, "../uploads/portfolio");
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50 MB
});

// ===== ROUTES =====
app.get("/", (req, res) => res.sendFile(path.join(__dirname, "../client", "index.html")));
app.get("/google", (req, res) => res.sendFile(path.join(__dirname, "../client", "google.html")));

app.post("/api/v1/register", (req, res) => {
  const { userId } = req.body;
  if (!userId) return res.status(400).send("User ID required");
  onlineUsers.set(userId, `simulated-${Date.now()}`);
  res.status(200).send("Registration simulated");
});

app.get("/api/v1/online-users", (req, res) => res.json(Array.from(onlineUsers.keys())));

app.get("/api/v1/states", (req, res) => {
  const { state } = req.query;
  if (state) {
    const lgas = database.getLGAsByState(state);
    if (!lgas) return res.status(404).json({ error: "State not found" });
    return res.json({ state, lgas });
  }
  res.json({ states: database.getAllStates() });
});

app.get("/api/v1/fields", (req, res) => {
  const { field } = req.query;
  if (field) {
    const industries = database.getIndustriesByField(field);
    if (!industries) return res.status(404).json({ error: "Field not found" });
    return res.json({ field, industries });
  }
  res.json({ fields: database.getAllFields() });
});

// ===== PORTFOLIO UPLOAD ENDPOINT =====
app.post("/api/v1/creator/upload-portfolio-files", upload.array("files", 20), (req, res) => {
  const BASE_URL = process.env.BASE_URL || `http://localhost:${PORT}`;
  try {
    if (!req.files || req.files.length === 0) 
      return res.status(400).json({ error: "No files uploaded" });

    const fileUrls = req.files.map(f => 
      `${BASE_URL}/uploads/portfolio/${f.filename}`.replace(/\\/g, "/")
    );

    res.status(200).json({ message: "Files uploaded successfully", files: fileUrls });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Failed to upload files" });
  }
});


// ===== IMPORT ROUTES =====
const creatorRoute = require("./creators/creators-route");
const recruiterRoute = require("./recruiters/recruiters-route");
const jobRoute = require("./job/job-route");
const waitlistRoute = require("./waitlist/waitlist-route");
const userRoute = require("./user/user-route");
const notificationRoute = require("./notification/notification-route");

app.use("/api/v1/creator", creatorRoute);
app.use("/api/v1/recruiter", recruiterRoute);
app.use("/api/v1/job", jobRoute);
app.use("/api/v1/waitlist", waitlistRoute);
app.use("/api/v1/user", userRoute);
app.use("/api/v1/notification", notificationRoute);

// ===== START SERVER =====
async function mainApp() {
  try {
    await database.connect();
    console.log("====== Database connected !!! ======");

    server.listen(PORT, () => {
      logger.info(`🚀 APP: Started On ${PORT}`);
    });

    console.log("====== Portgig is Up And Running !!! ======");

    process.on("unhandledRejection", (err) => {
      logger.error("[unhandledRejection] Shutting down server...");
      logger.error(err);
      throw err;
    });

    process.on("uncaughtException", (err) => {
      logger.error("[uncaughtException] Shutting down server...");
      logger.error(err);
      throw err;
    });
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

mainApp();
