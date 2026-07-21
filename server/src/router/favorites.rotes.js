const express = require("express");
const router = express.Router();
const pool = require("../config/db");


// ===============================
// GET USER FAVORITES
// ===============================
router.get("/me", async (req, res) => {
  try {
    const userId = req.headers.userid;

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        p.price,
        p.sale_price,
        p.image,
        b.name AS brand_name,
        c.name AS category_name
      FROM favorites f
      JOIN products p ON p.id = f.product_id
      LEFT JOIN brands b ON b.id = p.brand_id
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE f.user_id = $1
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("GET favorites error:", err);
    res.status(500).json({ message: "Server error" });
  }
});
// ===============================
// ADD TO FAVORITES
// ===============================
router.post("/me", async (req, res) => {
  try {      
    const userId = req.headers.userid;
    const { productId } = req.body;

    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing data" });
    }

    await pool.query(
      `
      INSERT INTO favorites (user_id, product_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, product_id) DO NOTHING
      `,
      [userId, productId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("ADD favorite error:", err);
    res.status(500).json({ message: "Server error" });
  }
});


// ===============================
// REMOVE FROM FAVORITES
// ===============================
router.delete("/me/:productId", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const productId = req.params.productId;

    if (!userId || !productId) {
      return res.status(400).json({ message: "Missing data" });
    }

    await pool.query(
      `
      DELETE FROM favorites
      WHERE user_id = $1 AND product_id = $2
      `,
      [userId, productId]
    );

    res.json({ success: true });
  } catch (err) {
    console.error("DELETE favorite error:", err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;