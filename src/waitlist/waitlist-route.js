const express = require("express");
const { loginLimiter } = require("../config/rate-limiter");
const router = express.Router();
const logger = require("../config/logging").getLogger("WAITLIST:ROUTE");
const waitlistService = require("./waitlist-service");

router.post("/subscribe", async (req, res) => {
  try {
    const data = await waitlistService.subscribe(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.get("/get-subscribers", async (req, res) => {
  try {
    const data = await waitlistService.getSubscribers("userId", req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.post("/sends-to-subscribers", async (req, res) => {
  try {
    const data = await waitlistService.sendToWaitlist("userId", req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.delete("/remove-subscribers", async (req, res) => {
  try {
    const data = await waitlistService.deleteFromWaitlist(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.post("/send-email", loginLimiter, async (req, res) => {
  try {
    const data = await waitlistService.sendEmails(req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

module.exports = router;
