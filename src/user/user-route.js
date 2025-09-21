const express = require("express");
const { loginLimiter } = require("../config/rate-limiter");
const router = express.Router();
const logger = require("../config/logging").getLogger("USER:ROUTE");
const userService = require("./user-service");
const jwt = require("jsonwebtoken");

const GOOGLE_OAUTH_URL = process.env.GOOGLE_OAUTH_URL;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL;

const GOOGLE_OAUTH_SCOPES = [
  "https://www.googleapis.com/auth/userinfo.email",
  "https://www.googleapis.com/auth/userinfo.profile",
];

const redirectUrl = process.env.CLIENT_HOME_URL;

const startGoogleAuth = (req, res) => {
  const role = (req.query.role || req.body?.role || "Creator");
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: process.env.GOOGLE_CALLBACK_URL,           // EXACT match in Google console
    access_type: 'offline',
    response_type: 'code',
    state: JSON.stringify({ role }),
    scope: (process.env.GOOGLE_OAUTH_SCOPES || [
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/userinfo.profile'
    ]).toString().includes('http')
      ? ['https://www.googleapis.com/auth/userinfo.email','https://www.googleapis.com/auth/userinfo.profile'].join(' ')
      : process.env.GOOGLE_OAUTH_SCOPES,
    prompt: 'consent' // ensures refresh_token on repeat grants
  });

  const authBase = process.env.GOOGLE_OAUTH_URL || 'https://accounts.google.com/o/oauth2/v2/auth';
  const url = `${authBase}?${params.toString()}`;
  console.log('Google auth URL:', url);
  return res.redirect(url);
};

router.get('/auth/google', startGoogleAuth);
router.post('/auth/google', startGoogleAuth);
router.get("/auth/google/callback", async (req, res) => {
  try {
    const data = await userService.googleLogin(req);
    const jwtPayload = {
      userId: data.userId,
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      profile: data.profile,
      role: data.role,
      //   isFirstTime: data.isFirstTime,
    };

    const sessionToken = jwt.sign(jwtPayload, process.env.JWT_SECRET, {
      expiresIn: "15m",
    });

    // res.cookie("session", sessionToken, {
    //   httpOnly: true,
    //   secure: true,
    //   maxAge: 15 * 60 * 1000,
    // });
    console.log("reach here");
    console.log(redirectUrl);

    res.redirect(
      // `${process.env.CLIENT_HOME_URL}?login=success?token=${sessionToken}`
      `${redirectUrl}?login=success&token=${sessionToken}`
    );
    // return res.status(401).json({ message: "Unauthorized" });
  } catch (error) {
    const errorMessage = encodeURIComponent(error.message);
    res.redirect(`${redirectUrl}?login=failed&error=${errorMessage}`);
  }
});

const authenticateToken = (req, res, next) => {
  const session = req.query.token;
  if (!session) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  jwt.verify(session, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Forbidden" });

    req.user = decoded;
    next();
  });
};

router.post("/me", authenticateToken, async (req, res) => {
  try {
    res.json({
      message: "Success",
      status: 200,
      access_token: req.user.access_token,
      refresh_token: req.user.refresh_token,
      profile: req.user.profile,
      role: req.user.role,
      //   isFirstTime: req.user.isFirstTime,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
