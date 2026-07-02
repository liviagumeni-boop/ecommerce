const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/* ================= LIST EXITS ================= */
router.get("/stock-exits", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 12);
  const offset = (page - 1) * limit;

  // frontend params
  const product = req.query.product?.trim() || null;
  const party = req.query.party?.trim() || null;
  const type = req.query.type || null;

  const startDate =
    req.query.startDate && req.query.startDate !== ""
      ? req.query.startDate
      : null;

  const endDate =
    req.query.endDate && req.query.endDate !== ""
      ? req.query.endDate
      : null;

  const productParam = product ? `%${product}%` : null;
  const partyParam = party ? `%${party}%` : null;

  try {
const matchedSql = `
SELECT DISTINCT b.id
FROM stock_exit_bills b
JOIN stock_exit_entries se ON se.bill_id = b.id
JOIN products p ON p.id = se.product_id
WHERE
  ($1::text IS NULL OR p.name ILIKE $1::text)
  AND ($2::text IS NULL OR b.supplier_name ILIKE $2::text)
  AND ($3::text IS NULL OR b.type = $3::text)
  AND ($4::date IS NULL OR b.created_at::date >= $4::date)
  AND ($5::date IS NULL OR b.created_at::date <= $5::date)
`;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${matchedSql}) m`,
      [productParam, partyParam, type, startDate, endDate]
    );

    const total = parseInt(countResult.rows[0].count, 10);

const dataResult = await pool.query(
  `
  WITH matched AS (${matchedSql})
  SELECT
    b.id AS exit_id,
    b.supplier_id AS party_id,
    b.supplier_name AS party_name,
    b.contact,
    b.type AS exit_type,
    b.created_at,

    COUNT(se.id) AS item_count,
    SUM(se.quantity) AS total_quantity,
    SUM(se.quantity * se.unit_price) AS total_amount,

    -- products
    STRING_AGG(DISTINCT p.name, ', ') AS product_names,

    -- ✅ FULL VARIANT DETAILS
    COALESCE(
      json_agg(
        DISTINCT jsonb_build_object(
          'product_id', p.id,
          'product_name', p.name,
          'variant_id', v.id,
          'size', v.size,
          'color', v.color,
          'memory', v.memory,
          'quantity', se.quantity,
          'unit_price', se.unit_price
        )
      ) FILTER (WHERE se.id IS NOT NULL),
      '[]'
    ) AS items

  FROM stock_exit_bills b
  JOIN stock_exit_entries se ON se.bill_id = b.id
  JOIN products p ON p.id = se.product_id
  LEFT JOIN product_variants v ON v.id = se.variant_id

  WHERE b.id IN (SELECT id FROM matched)

  GROUP BY b.id
  ORDER BY b.created_at DESC
  LIMIT $6 OFFSET $7
  `,
  [productParam, partyParam, type, startDate, endDate, limit, offset]
);

    res.json({
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
  console.error("ERROR:", err);
  res.status(500).json({
    message: "Failed to fetch exits",
    error: err.message,
  });
}
});

/* ================= SINGLE EXIT ================= */
router.get("/stock-exits/:id", async (req, res) => {
  try {
    const bill = await pool.query(
      `SELECT * FROM stock_exit_bills WHERE id=$1`,
      [req.params.id]
    );

    if (!bill.rows.length) {
      return res.status(404).json({ message: "Exit not found" });
    }

    const items = await pool.query(
      `
      SELECT
        se.id,
        se.product_id,
        se.variant_id,
        se.quantity,
        se.unit_price,
        p.name AS product_name,

        v.size,
        v.color,
        v.memory

      FROM stock_exit_entries se
      JOIN products p ON p.id = se.product_id
      LEFT JOIN product_variants v ON v.id = se.variant_id
      WHERE se.bill_id = $1
      `,
      [req.params.id]
    );

    res.json({ ...bill.rows[0], items: items.rows });
  } catch (err) {
    console.error("GET /stock-exits/:id error:", err);
    res.status(500).json({ message: "Failed to load exit details" });
  }
});

/* ================= DELETE EXIT ================= */
router.delete("/stock-exits/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM stock_exit_bills WHERE id=$1`, [
      req.params.id,
    ]);

    res.json({ message: "Deleted" });
  } catch (err) {
    console.error("DELETE /stock-exits error:", err);
    res.status(500).json({ message: "Failed delete" });
  }
});
router.post("/stock-exits", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const {
      exit_type,
      party_id,
      party_name,
      contact,
      items,
    } = req.body;

    const bill = await client.query(
      `
      INSERT INTO stock_exit_bills
      (supplier_id, supplier_name, contact, type)
      VALUES ($1,$2,$3,$4)
      RETURNING id
      `,
      [
        party_id,
        party_name,
        contact,
        exit_type,
      ]
    );

    const billId = bill.rows[0].id;

    for (const item of items) {
      await client.query(
        `
        INSERT INTO stock_exit_entries
        (bill_id, product_id, variant_id, quantity, unit_price)
        VALUES ($1,$2,$3,$4,$5)
        `,
        [
          billId,
          item.product_id,
          item.variant_id,
          item.quantity,
        item.unit_price || 0,
        ]
      );
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Exit created",
      id: billId,
    });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Failed to create exit" });
  } finally {
    client.release();
  }
});

router.post("/stock-exits/export", async (req, res) => {
  try {
    const { ids } = req.body;

    const result = await pool.query(
      `
      SELECT b.id, b.supplier_name, b.created_at,
             se.product_id, p.name AS product_name,
             se.quantity, se.unit_price
      FROM stock_exit_bills b
      JOIN stock_exit_entries se ON se.bill_id = b.id
      JOIN products p ON p.id = se.product_id
      WHERE b.id = ANY($1)
      ORDER BY b.created_at DESC
      `,
      [ids]
    );

    let csv = "ExitID,Product,Qty,Unit Price,Total\n";

    for (const r of result.rows) {
      csv += `${r.id},${r.product_name},${r.quantity},${r.unit_price},${r.quantity * r.unit_price}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="stock-exits.csv"'
    );

    res.send(csv);
  } catch (err) {
    console.error("EXPORT ERROR:", err);
    res.status(500).json({ message: "Export failed" });
  }
});
router.get("/products/search", async (req, res) => {
  const q = req.query.q?.trim() || "";

  try {
    const result = await pool.query(
      `
      SELECT 
        p.id,
        p.name,
        p.qty,
        p.sale_price,

        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object(
              'id', v.id,
              'product_id', v.product_id,
              'size', v.size,
              'color', v.color,
              'memory', v.memory,
              'qty', v.qty
            )
          ) FILTER (WHERE v.id IS NOT NULL),
          '[]'
        ) AS variants

      FROM products p
      LEFT JOIN product_variants v ON v.product_id = p.id
      WHERE p.name ILIKE $1
      GROUP BY p.id
      ORDER BY p.name ASC
      LIMIT 20
      `,
      [`%${q}%`]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("PRODUCT SEARCH ERROR:", err);
    res.status(500).json({ message: "Failed to search products" });
  }
});
module.exports = router;