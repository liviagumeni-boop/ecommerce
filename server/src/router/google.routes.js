const express = require("express");
const passport = require("../services/google.service");
const jwt = require("jsonwebtoken");

const router = express.Router();

// START GOOGLE LOGIN
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

// CALLBACK
router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user.id, role: req.user.role },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

  const clientUrl = process.env.FRONTEND_URL.split(",")[0];
   res.redirect(
  `${clientUrl}/?token=${token}&role=${req.user.role}`
);
  }
);

module.exports = router;