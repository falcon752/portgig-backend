const express = require("express");
const { loginLimiter } = require("../config/rate-limiter");
const router = express.Router();
const logger = require("../config/logging").getLogger("CREATOR:ROUTE");
const creatorService = require("./creators-service");

const multer = require("multer");
const path = require("path");
const fs = require("fs");

const uploadDir = path.join(__dirname, "..", "..", "uploads", "portfolio");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "..", "..", "uploads", "portfolio"));
  },
  filename: (req, file, cb) => {
    cb(null, `${req.userId}-${Date.now()}${path.extname(file.originalname)}`);
  },
});

const fileFilter = (req, file, cb) => {
  const filetypes = /\.(jpg|jpeg|png|pdf|doc|docx)$/i;
  if (filetypes.test(file.originalname)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "File must be an image (jpg, jpeg, png) or document (pdf, doc, docx)"
      ),
      false
    );
  }
};

// Multer instance for handling multiple file uploads
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // Limit file size to 5MB
});

router.post("/register", async (req, res) => {
  try {
    const data = await creatorService.register(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/validate-registration-otp", loginLimiter, async (req, res) => {
  try {
    const data = await creatorService.validateRegistrationOtp(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const data = await creatorService.login(req.body, req.useragent);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/resend-otp", loginLimiter, async (req, res) => {
  try {
    const data = await creatorService.resendOtp(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/request-password-reset", async (req, res) => {
  try {
    const data = await creatorService.requestPasswordReset(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/reset-password", async (req, res) => {
  try {
    const data = await creatorService.resetPassword(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/update-password", async (req, res) => {
  try {
    const data = await creatorService.updatePassword(req.userId, req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/refresh-access-token", loginLimiter, async (req, res) => {
  try {
    const data = await creatorService.refreshAccessToken(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/profile", async (req, res) => {
  try {
    const data = await creatorService.getCreatorByIdAgg(req.userId);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.post(
  "/upload-portfolio-files",
  upload.array("files", 20),
  async (req, res) => {
    const BASE_URL = process.env.BASE_URL || "http://127.0.0.1:5008";
    try {
      const fileUrls = req.files.map((file) =>
        `${BASE_URL}/uploads/portfolio/${file.filename}`.replace(/\\/g, "/")
      );
      res.json({
        message: "Files uploaded successfully",
        files: fileUrls,
        status: 200,
      });
    } catch (error) {
      res.status(400).json({ error: error.message, status: 400 });
    }
  }
);

router.put("/update-profile", async (req, res) => {
  try {
    const data = await creatorService.updateProfileBySection(
      req.userId,
      req.body,
      req.query
    );
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

// creator.routes.js

router.put("/profile-views/", async (req, res) => {
  try {
    const data = await creatorService.incrementProfileViews(req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/social-clicks/", async (req, res) => {
  try {
    const data = await creatorService.incrementSocialClick(req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/rating", async (req, res) => {
  try {
    const data = await creatorService.addRating(
      req.body,
      req.query,
      req.userId
    );
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/get-recruiter-review", async (req, res) => {
  try {
    const data = await creatorService.getRecruiter(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/get-creators", async (req, res) => {
  try {
    const userId = req.userId;
    const queryParams = req.query;

    const result = await creatorService.getCreator(userId, queryParams);
    res.status(200).json(result);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

module.exports = router;
