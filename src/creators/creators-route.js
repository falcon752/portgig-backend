const express = require("express");
const { loginLimiter } = require("../config/rate-limiter");
const router = express.Router();
const logger = require("../config/logging").getLogger("CREATOR:ROUTE");
const creatorService = require("./creators-service");

const multer = require("multer");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const crypto = require("crypto");
const path = require("path");

const s3 = new S3Client({
  endpoint: process.env.SPACES_ENDPOINT,
  region: process.env.SPACES_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.SPACES_KEY,
    secretAccessKey: process.env.SPACES_SECRET,
  },
  forcePathStyle: false,
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

// Use memory storage — files are uploaded to Cloudinary, not saved to disk
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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
    const creatorId = req.query.creatorId;
    const username = req.query.username;
    
    let data;
    if (username) {
      // Public access by username
      data = await creatorService.getCreatorByUsernameAgg(username);
    } else if (creatorId) {
      // Legacy access by creator ID
      data = await creatorService.getCreatorByIdAgg(creatorId);
    } else {
      throw new Error("Either creatorId or username must be provided");
    }
    
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.post("/upload-portfolio-files", upload.array("files", 20), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files provided", status: 400 });
    }

    const uploadToSpaces = async (file) => {
      const ext = path.extname(file.originalname);
      const filename = `portfolio/${crypto.randomUUID()}${ext}`;
      await s3.send(new PutObjectCommand({
        Bucket: process.env.SPACES_BUCKET,
        Key: filename,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: "public-read",
      }));
      return `${process.env.SPACES_CDN_URL || process.env.SPACES_ENDPOINT.replace("https://", `https://${process.env.SPACES_BUCKET}.`)}/${filename}`;
    };

    const fileUrls = await Promise.all(req.files.map((f) => uploadToSpaces(f)));

    res.json({
      message: "Files uploaded successfully",
      files: fileUrls,
      status: 200,
    });
  } catch (error) {
    res.status(400).json({ error: error.message, status: 400 });
  }
});


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
