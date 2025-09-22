const express = require("express");
const { loginLimiter } = require("../config/rate-limiter");
const router = express.Router();
const logger = require("../config/logging").getLogger("RECRUITER:ROUTE");
const recruiterService = require("./recruiters-service");

router.post("/register", async (req, res) => {
  try {
    const data = await recruiterService.register(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/validate-registration-otp", loginLimiter, async (req, res) => {
  try {
    const data = await recruiterService.validateRegistrationOtp(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.post("/login", loginLimiter, async (req, res) => {
  try {
    const data = await recruiterService.login(req.body, req.useragent);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/resend-otp", loginLimiter, async (req, res) => {
  try {
    const data = await recruiterService.resendOtp(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/request-password-reset", async (req, res) => {
  try {
    const data = await recruiterService.requestPasswordReset(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/reset-password", async (req, res) => {
  try {
    const data = await recruiterService.resetPassword(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/update-password", async (req, res) => {
  try {
    const data = await recruiterService.updatePassword(req.userId, req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/refresh-access-token", loginLimiter, async (req, res) => {
  try {
    const data = await recruiterService.refreshAccessToken(
      req.userId,
      req.query
    );
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/profile", async (req, res) => {
  try {
    const data = await recruiterService.getUserById(req.userId);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/update-profile", async (req, res) => {
  try {
    const data = await recruiterService.updateProfileBySection(
      req.userId,
      req.body,
      req.query
    );
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/rating", async (req, res) => {
  try {
    const data = await recruiterService.addRating(
      req.body,
      req.query,
      req.userId
    );
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/get-creator-review", async (req, res) => {
  try {
    const data = await recruiterService.getCreator(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/dashboard", async (req, res) => {
  try {
    const data = await recruiterService.getRecruiterDashboard(req.userId);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.get("/all-users-by-admin", async (req, res) => {
  try {
    const data = await recruiterService.getAllUsers(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.get("/get-user-by-id", async (req, res) => {
  try {
    const data = await recruiterService.getUserTypeById(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.get("/get-job-details", async (req, res) => {
  try {
    const data = await recruiterService.getAdminJobsDashboard(
      req.userId,
      req.query
    );
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.post("/newsletter", async (req, res) => {
  try {
    const data = await recruiterService.sendNewsletter(req.userId, req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.delete("/delete-account", async (req, res) => {
  try {
    const data = await recruiterService.deleteAccount(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.put("/update-recruiter-status", async (req, res) => {
  try {
    const data = await recruiterService.updateRecruiterStatus(
      req.userId,
      req.query
    );
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

router.get("/get-emails", async (req, res) => {
  try {
    const { type } = req.query;
    const data = await recruiterService.getEmailsByTemplate(type,req.userId);
    res.json(data);
  } catch (error) {
    res
      .status(error.status || 500)
      .json(error.toObject ? error.toObject() : { message: error.message });
  }
});

module.exports = router;
