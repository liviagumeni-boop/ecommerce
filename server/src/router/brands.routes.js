const express = require("express");
const pool = require("../config/db");

const router = express.Router();

// GET ALL BRANDS (with category)
router.get("/", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.id,
        b.name,
        b.category_id,
        c.name AS category_name
      FROM brands b
      JOIN categories c ON c.id = b.category_id
      ORDER BY b.id DESC
    `);

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE BRAND
router.post("/", async (req, res) => {
  try {
    const { name, category_id } = req.body;

    const result = await pool.query(
      "INSERT INTO brands (name, category_id) VALUES ($1,$2) RETURNING *",
      [name, category_id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// UPDATE BRAND
router.put("/:id", async (req, res) => {
  try {
    const { name, category_id } = req.body;

    const result = await pool.query(
      "UPDATE brands SET name=$1, category_id=$2 WHERE id=$3 RETURNING *",
      [name, category_id, req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE BRAND
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM brands WHERE id=$1", [req.params.id]);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;