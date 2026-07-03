const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // your pg Pool

// GET /api/users/me
router.get("/me", async (req, res) => {
  try {
    const userId = req.headers.userid;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        address,
        phone,
        avatar,
        role,
        created_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me
router.put("/me", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { name, email, address } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2,
        address = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING id,name,email,address
      `,
      [name, email, address, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me/address
router.put("/me/address", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { address } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
        address = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id,address
      `,
      [address, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me/orders
router.get("/me/orders", async (req, res) => {
  try {
    const userId = req.headers.userid;

    const result = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;