const express = require("express");
const { passport } = require("../services/google.service");
const jwt = require("jsonwebtoken");

const router = express.Router();

function requireGoogleConfigured(req, res, next) {
  if (!passport._strategy("google")) {
    return res.status(503).json({ message: "Google sign-in is not configured yet" });
  }
  next();
}

// START GOOGLE LOGIN
router.get(
  "/google",
  requireGoogleConfigured,
  (req, res, next) => passport.authenticate("google", { scope: ["profile", "email"] })(req, res, next)
);

// CALLBACK
router.get(
  "/google/callback",
  requireGoogleConfigured,
  (req, res, next) => passport.authenticate("google", { session: false })(req, res, next),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    const clientUrl = process.env.FRONTEND_URL.split(",")[0];

    const user = encodeURIComponent(JSON.stringify({
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
    }));

    res.redirect(`${clientUrl}/?token=${token}&role=${req.user.role}&user=${user}`);
  }
);

module.exports = router;