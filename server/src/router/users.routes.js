const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/* =========================================================
   GET ALL (LIST + SEARCH + ROLE + PAGINATION)
========================================================= */
router.get("/", async (req, res) => {
  try {
    const { search, role, page = 1, limit = 12 } = req.query;

    const offset = (page - 1) * limit;

    let baseQuery = `
      FROM suppliers
      WHERE 1=1
    `;

    const values = [];
    let i = 1;

    // SEARCH
    if (search) {
      values.push(`%${search}%`);
      baseQuery += `
        AND (
          name ILIKE $${i} OR
          phone ILIKE $${i} OR
          email ILIKE $${i} OR
          contact_name ILIKE $${i}
        )
      `;
      i++;
    }

    // ROLE FILTER
    if (role === "customer" || role === "supplier") {
      values.push(role);
      baseQuery += ` AND role = $${i}`;
      i++;
    }

    // COUNT QUERY
    const countResult = await pool.query(
      `SELECT COUNT(*) ${baseQuery}`,
      values
    );

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    // DATA QUERY
    values.push(limit, offset);

    const dataQuery = `
      SELECT *
      ${baseQuery}
      ORDER BY created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
    `;

    const result = await pool.query(dataQuery, values);

    res.json({
      data: result.rows,
      total,
      totalPages,
      page: parseInt(page),
    });

  } catch (err) {
    console.error("PARTIES ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   GET SINGLE
========================================================= */
router.get("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM suppliers WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   CREATE
========================================================= */
router.post("/", async (req, res) => {
  try {
    const { name, contact_name, phone, email, address, role } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Name required" });
    }

    if (!["customer", "supplier"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const result = await pool.query(
      `
      INSERT INTO suppliers
      (name, contact_name, phone, email, address, role)
      VALUES ($1,$2,$3,$4,$5,$6)
      RETURNING *
      `,
      [name, contact_name, phone, email, address, role]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   UPDATE
========================================================= */
router.put("/:id", async (req, res) => {
  try {
    const { name, contact_name, phone, email, address, role } = req.body;

    const result = await pool.query(
      `
      UPDATE suppliers
      SET
        name=$1,
        contact_name=$2,
        phone=$3,
        email=$4,
        address=$5,
        role=$6
      WHERE id=$7
      RETURNING *
      `,
      [name, contact_name, phone, email, address, role, req.params.id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   DELETE
========================================================= */
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query(
      `DELETE FROM suppliers WHERE id = $1`,
      [req.params.id]
    );

    if (!result.rowCount) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: "Deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

/* =========================================================
   SEARCH (autocomplete)
========================================================= */
router.get("/search", async (req, res) => {
  try {
    const q = `%${req.query.q || ""}%`;

    const result = await pool.query(
      `
      SELECT id, name, phone, email, role
      FROM suppliers
      WHERE
        name ILIKE $1 OR
        phone ILIKE $1 OR
        email ILIKE $1
      ORDER BY name ASC
      LIMIT 20
      `,
      [q]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
router.post("/export", async (req, res) => {
  try {
    const { ids, search, role } = req.body;

    let query = `
      SELECT id, name, contact_name, phone, email, address, role, created_at
      FROM suppliers
      WHERE 1=1
    `;

    const values = [];
    let i = 1;

    // filter by selected IDs
    if (ids && ids.length > 0) {
      const placeholders = ids.map((_, idx) => `$${idx + 1}`).join(",");
      query += ` AND id IN (${placeholders})`;
      values.push(...ids);
      i = ids.length + 1;
    }

    // optional search
    if (search) {
      values.push(`%${search}%`);
      query += ` AND (
        name ILIKE $${i} OR
        phone ILIKE $${i} OR
        email ILIKE $${i}
      )`;
      i++;
    }

    // optional role
    if (role) {
      values.push(role);
      query += ` AND role = $${i}`;
      i++;
    }

    query += ` ORDER BY created_at DESC`;

    const result = await pool.query(query, values);

    // CSV BUILD
    const rows = result.rows;

    let csv = "ID,Name,Contact,Phone,Email,Address,Role,Created At\n";

    rows.forEach(r => {
      csv += `"${r.id}","${r.name}","${r.contact_name || ""}","${r.phone || ""}","${r.email || ""}","${r.address || ""}","${r.role}","${r.created_at}"\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=parties.csv");

    res.send(csv);

  } catch (err) {
    console.error("EXPORT ERROR:", err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;