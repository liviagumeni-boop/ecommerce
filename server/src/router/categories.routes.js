const express = require("express");
const pool = require("../config/db");
const { validateCategoryName } = require("../validators/categoriesValidator");
const router = express.Router();

// ================= GET (search + sort) =================
router.get("/", async (req, res) => {
  try {
    const { search, sort } = req.query;

    let query = "SELECT * FROM categories";
    let values = [];
    let conditions = [];

    // SEARCH
    if (search) {
      values.push(`%${search}%`);
      conditions.push(`name ILIKE $${values.length}`);
    }

    // WHERE part
    if (conditions.length > 0) {
      query += " WHERE " + conditions.join(" AND ");
    }

    // SORT (safe)
    if (sort === "asc") {
      query += " ORDER BY name ASC";
    } else if (sort === "desc") {
      query += " ORDER BY name DESC";
    } else {
      query += " ORDER BY id DESC";
    }

    const result = await pool.query(query, values);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= CREATE =================
router.post("/", async (req, res) => {
  try {
    const { name } = req.body;

    const nameError = validateCategoryName(name);
    if (nameError) {
      return res.status(400).json({ message: nameError });
    }

    const result = await pool.query(
      "INSERT INTO categories (name) VALUES ($1) RETURNING *",
      [name.trim()]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= UPDATE =================
router.put("/:id", async (req, res) => {
  try {
    const { name } = req.body;

    const nameError = validateCategoryName(name);
    if (nameError) {
      return res.status(400).json({ message: nameError });
    }

    const result = await pool.query(
      "UPDATE categories SET name=$1 WHERE id=$2 RETURNING *",
      [name.trim(), req.params.id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ================= DELETE =================
router.delete("/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM categories WHERE id=$1", [
      req.params.id,
    ]);

    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;