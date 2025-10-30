const express = require("express");
const router = express.Router();
const NotificationService = require("./notification-service");

// router.post("/notification", async (req, res) => {
//   try {
//     const data = await NotificationService.createActivity(req.userId, req.body);
//     res.json(data);
//   } catch (error) {
//     res.status(error.status).json(error.toObject());
//   }
// });

router.get("/", async (req, res) => {
  try {
    const data = await NotificationService.getNotifications(
      req.userId,
      req.query
    );
    res.json(data);
  } catch (error) {
    res.status(error.status).json(error.toObject());
  }
});

module.exports = router;
