const express = require("express");
const router = express.Router();
const db = require("../config/db");

router.get("/:code", async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();

    const result = await db.query(
      "SELECT * FROM coupons WHERE UPPER(code) = $1",
      [code]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Invalid coupon" });
    }

    const coupon = result.rows[0];

    if (!coupon.is_active) {
      return res.status(400).json({ message: "Coupon not active" });
    }

    if (new Date(coupon.expires_at) < new Date()) {
      return res.status(400).json({ message: "Coupon expired" });
    }

    res.json(coupon);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

module.exports = router;