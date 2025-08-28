const express = require("express");
const { loginLimiter } = require("../config/rate-limiter");
const router = express.Router();
const logger = require("../config/logging").getLogger("JOB:ROUTE");
const jobService = require("./job-service");

router.post("/create", async (req, res) => {
  try {
    const data = await jobService.createJob(req.userId, req.body);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.patch("/close", async (req, res) => {
  try {
    const data = await jobService.closeJob(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.get("/get", async (req, res) => {
  try {
    const data = await jobService.getJobs(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.delete("/remove", async (req, res) => {
  try {
    const data = await jobService.removejob(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.put("/apply", async (req, res) => {
  try {
    const data = await jobService.applyJob(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.get("/creator-get-jobs", async (req, res) => {
  try {
    const data = await jobService.creatorGetJobs(req.userId, req.query);
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

router.patch("/update-applicant-status", async (req, res) => {
  try {
    const data = await jobService.updateApplicantStatus(
      req.userId,
      req.query,
      req.body
    );
    res.json(data);
  } catch (error) {
    res.status(error.status || 500).json(error.toObject());
  }
});

module.exports = router;
