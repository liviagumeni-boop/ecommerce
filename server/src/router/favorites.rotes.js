const express = require("express");
const pool = require("../config/db");

const router = express.Router();


// GET ALL FAVORITES
router.get("/", async (req, res) => {
  try {
    const userId = req.headers.userid;

    const result = await pool.query(
      `
      SELECT p.*
      FROM favorites f
      JOIN products p ON p.id = f.product_id
      WHERE f.user_id = $1
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// ADD FAVORITE
router.post("/", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { productId } = req.body;

    await pool.query(
      `
      INSERT INTO favorites(user_id, product_id)
      VALUES($1,$2)
      ON CONFLICT DO NOTHING
      `,
      [userId, productId]
    );

    res.json({ message: "Added" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// REMOVE FAVORITE
router.delete("/:id", async (req, res) => {
  try {
    const userId = req.headers.userid;

    await pool.query(
      `
      DELETE FROM favorites
      WHERE user_id=$1
      AND product_id=$2
      `,
      [userId, req.params.id]
    );

    res.json({ message: "Removed" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;