const express = require("express");
const router = express.Router();
const pool = require("../config/db");

/* ================= LIST EXITS ================= */
router.get("/stock-exits", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 12);
  const offset = (page - 1) * limit;

  // Frontend sends one combined search-box value as both `product` and
  // `party` (same string in each). Treat it as a single search term that
  // should match EITHER the product name OR the party name — not require
  // both, which is what ANDing two separate params did (and which silently
  // returned nothing whenever a search only matched a customer/supplier
  // name and no product name).
  const search = (req.query.product || req.query.party || "").trim() || null;
  const type = req.query.type || null;

  const startDate = req.query.startDate || null;
  const endDate = req.query.endDate || null;

  const searchParam = search ? `%${search}%` : null;

  try {
    const matchedSql = `
      SELECT DISTINCT b.id
      FROM stock_exit_bills b
      JOIN stock_exit_entries se ON se.bill_id = b.id
      JOIN products p ON p.id = se.product_id
      WHERE
        ($1::text IS NULL OR p.name ILIKE $1 OR b.supplier_name ILIKE $1)
        AND ($2::text IS NULL OR b.type = $2)
        AND ($3::date IS NULL OR b.created_at::date >= $3)
        AND ($4::date IS NULL OR b.created_at::date <= $4)
    `;

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${matchedSql}) m`,
      [searchParam, type, startDate, endDate]
    );

    const total = parseInt(countResult.rows[0].count, 10);

    const dataResult = await pool.query(
      `
      WITH matched AS (${matchedSql})
      SELECT
        b.id AS exit_id,
        b.exit_code,
        b.supplier_id AS party_id,
        b.supplier_name AS party_name,
        b.contact,
        b.type AS exit_type,
        b.created_at,

        COUNT(se.id) AS item_count,
        SUM(se.quantity) AS total_quantity,
        SUM(se.quantity * se.unit_price) AS total_amount,

        STRING_AGG(DISTINCT p.name, ', ') AS product_names,

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
      LIMIT $5 OFFSET $6
      `,
      [searchParam, type, startDate, endDate, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch exits" });
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
    console.error(err);
    res.status(500).json({ message: "Failed to load exit details" });
  }
});

/* ================= CREATE EXIT (WITH EXIT CODE) ================= */
router.post("/stock-exits", async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { exit_type, party_id, party_name, contact, items } = req.body;

    // 🔥 generate EXIT-1001 style code
    const seqRes = await client.query(
      `SELECT nextval('stock_exit_code_seq')`
    );
    const exitCode = `EXIT-${seqRes.rows[0].nextval}`;

    const bill = await client.query(
      `
      INSERT INTO stock_exit_bills
      (exit_code, supplier_id, supplier_name, contact, type)
      VALUES ($1,$2,$3,$4,$5)
      RETURNING *
      `,
      [exitCode, party_id, party_name, contact, exit_type]
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
      exit_code: exitCode,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Failed to create exit" });
  } finally {
    client.release();
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
    console.error(err);
    res.status(500).json({ message: "Failed delete" });
  }
});

/* ================= EXPORT ================= */
router.post("/stock-exits/export", async (req, res) => {
  try {
    const { ids } = req.body;

    const result = await pool.query(
      `
      SELECT b.exit_code, b.supplier_name, b.created_at,
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

    let csv = "ExitCode,Product,Qty,Unit Price,Total\n";

    for (const r of result.rows) {
      csv += `${r.exit_code},${r.product_name},${r.quantity},${r.unit_price},${r.quantity * r.unit_price}\n`;
    }

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="stock-exits.csv"'
    );

    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Export failed" });
  }
});

module.exports = router;