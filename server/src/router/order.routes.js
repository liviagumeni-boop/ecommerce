const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/* =========================
   GET ALL ORDERS (WITH USER)
========================= */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        o.id,
        o.total,
        o.status,
        o.created_at,
        o.user_id,
        u.name AS user_name
      FROM orders o
      LEFT JOIN users u ON u.id = o.user_id
      ORDER BY o.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE STATUS (MARK DELIVERED)
========================= */
router.patch("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    console.log("PATCH /orders/:id");
    console.log("ID:", id);
    console.log("STATUS:", status);

    const result = await pool.query(
      `UPDATE orders 
       SET status = $1 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});
router.get("/:id", async (req, res) => {
  const { id } = req.params;

  const result = await pool.query(
    `SELECT o.*, u.name AS user_name
     FROM orders o
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.id = $1`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ message: "Not found" });
  }

  res.json(result.rows[0]);
});
module.exports = router;