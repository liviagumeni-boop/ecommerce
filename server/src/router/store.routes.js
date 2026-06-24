const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET store settings
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM store_settings LIMIT 1"
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE store settings
router.put("/", async (req, res) => {
  try {
    const { store_name, email } = req.body;

    const result = await pool.query(
      `
      UPDATE store_settings
      SET store_name=$1,
          email=$2
      WHERE id=1
      RETURNING *
      `,
      [store_name, email]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;