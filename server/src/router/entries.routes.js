// routes/stockEntries.js
//
// Schema (after migration_add_stock_entry_bills.sql):
//
// product_variants:    id, product_id, size, color, memory, qty
// suppliers:            id, name, contact_name, phone, email, address, created_at
// stock_entry_bills:    id, supplier_id, supplier_name, contact, created_by, created_at
// stock_entries:        id, product_id, variant_id, bill_id, quantity, created_at
//                        (bill_id -> stock_entry_bills.id, ON DELETE CASCADE)
//
// One "New Stock Entry" submission = ONE bill row + one stock_entries
// row per product/variant in that submission.
//
// Adjust the pool import path to your project.

const express = require("express");
const router = express.Router();
const pool = require("../config/db"); // <-- adjust path

/* ============================================================
   PRODUCT SEARCH (search-as-you-type, with variants attached)
   GET /products/search?q=iphone
   ============================================================ */
router.get("/products/search", async (req, res) => {
  const q = (req.query.q || "").trim();

  if (!q) return res.json([]);

  try {
    const productsResult = await pool.query(
      `SELECT id, name, qty
       FROM products
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT 15`,
      [`%${q}%`]
    );

    const products = productsResult.rows;
    if (products.length === 0) return res.json([]);

    const ids = products.map((p) => p.id);

    const variantsResult = await pool.query(
      `SELECT id, product_id, size, color, memory, qty
       FROM product_variants
       WHERE product_id = ANY($1::int[])`,
      [ids]
    );

    const variantsByProduct = {};
    for (const v of variantsResult.rows) {
      if (!variantsByProduct[v.product_id]) variantsByProduct[v.product_id] = [];
      variantsByProduct[v.product_id].push(v);
    }

    const result = products.map((p) => ({
      ...p,
      variants: variantsByProduct[p.id] || [],
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Product search failed" });
  }
});

/* ============================================================
   SUPPLIER SEARCH (search-as-you-type)
   GET /suppliers/search?q=tech
   ============================================================ */
router.get("/suppliers/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json([]);

  try {
    const result = await pool.query(
      `SELECT id, name, contact_name, phone, email, address
       FROM suppliers
       WHERE name ILIKE $1
       ORDER BY name
       LIMIT 10`,
      [`%${q}%`]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Supplier search failed" });
  }
});

/* ============================================================
   LIST STOCK ENTRY BILLS (paginated, one row per bill)
   GET /stock-entries?page=1&limit=12&search=&date=YYYY-MM-DD
   ============================================================ */
router.get("/stock-entries", async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.max(1, parseInt(req.query.limit) || 12);
  const offset = (page - 1) * limit;

  const search = (req.query.search || "").trim();
  const startDate = req.query.startDate || null;
  const endDate = req.query.endDate || null;

  const searchParam = search ? `%${search}%` : null;

  try {
    // ================= MATCHED IDS =================
    const matchedSql = `
      SELECT DISTINCT b.id
      FROM stock_entry_bills b
      JOIN stock_entries se ON se.bill_id = b.id
      JOIN products p ON p.id = se.product_id
      WHERE
        ($1::text IS NULL OR p.name ILIKE $1 OR b.supplier_name ILIKE $1)
        AND ($2::date IS NULL OR b.created_at::date >= $2::date)
        AND ($3::date IS NULL OR b.created_at::date <= $3::date)
    `;

    // ================= COUNT =================
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM (${matchedSql}) m`,
      [searchParam, startDate, endDate]
    );

    const total = parseInt(countResult.rows[0].count, 10);

    // ================= DATA =================
    const dataResult = await pool.query(
      `WITH matched AS (${matchedSql})
       SELECT
         b.id AS bill_id,
         b.supplier_id,
         b.supplier_name,
         b.contact,
         b.created_by,
         b.created_at,
         COUNT(se.id) AS item_count,
         SUM(se.quantity) AS total_quantity,
         STRING_AGG(DISTINCT p.name, ', ') AS product_names
       FROM stock_entry_bills b
       JOIN stock_entries se ON se.bill_id = b.id
       JOIN products p ON p.id = se.product_id
       WHERE b.id IN (SELECT id FROM matched)
       GROUP BY b.id
       ORDER BY b.created_at DESC
       LIMIT $4 OFFSET $5`,
      [searchParam, startDate, endDate, limit, offset]
    );

    res.json({
      data: dataResult.rows,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch stock entries" });
  }
});
/* ============================================================
   SINGLE BILL DETAIL (bill info + every item inside it)
   GET /stock-entries/:id
   ============================================================ */
router.get("/stock-entries/:id", async (req, res) => {
  try {
    const billResult = await pool.query(
      `SELECT
         b.id, b.supplier_id, b.supplier_name, b.contact, b.created_by, b.created_at,
         s.name AS supplier_table_name, s.contact_name AS supplier_contact_name,
         s.phone AS supplier_phone, s.email AS supplier_email, s.address AS supplier_address
       FROM stock_entry_bills b
       LEFT JOIN suppliers s ON s.id = b.supplier_id
       WHERE b.id = $1`,
      [req.params.id]
    );

    if (billResult.rows.length === 0) {
      return res.status(404).json({ message: "Bill not found" });
    }

    const itemsResult = await pool.query(
      `SELECT
         se.id, se.product_id, se.variant_id, se.quantity,
         p.name AS product_name, p.description AS product_description,
         pv.size, pv.color, pv.memory
       FROM stock_entries se
       JOIN products p ON p.id = se.product_id
       LEFT JOIN product_variants pv ON pv.id = se.variant_id
       WHERE se.bill_id = $1
       ORDER BY se.id`,
      [req.params.id]
    );

    res.json({
      ...billResult.rows[0],
      items: itemsResult.rows,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to fetch bill" });
  }
});

/* ============================================================
   CREATE ONE BILL WITH ONE OR MANY ITEMS
   POST /stock-entries
   body: {
     supplier_id: number | null,
     supplier_name: string,
     contact: string,
     created_by: number,
     items: [{ product_id, variant_id: number | null, quantity }]
   }
   ============================================================ */
router.post("/stock-entries", async (req, res) => {
  const { supplier_id, supplier_name, contact, created_by, items } = req.body;

  if (!supplier_name || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({
      message: "supplier_name and at least one item are required",
    });
  }

  for (const item of items) {
    if (!item.product_id || !item.quantity || Number(item.quantity) <= 0) {
      return res.status(400).json({
        message: "Each item needs a valid product_id and quantity > 0",
      });
    }
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const billResult = await client.query(
      `INSERT INTO stock_entry_bills (supplier_id, supplier_name, contact, created_by, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [supplier_id || null, supplier_name, contact || null, created_by || null]
    );

    const bill = billResult.rows[0];
    const insertedItems = [];

    for (const item of items) {
      const result = await client.query(
        `INSERT INTO stock_entries
           (product_id, variant_id, bill_id, supplier_id, supplier_name, contact, quantity, created_by, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
         RETURNING *`,
        [
          item.product_id,
          item.variant_id || null,
          bill.id,
          bill.supplier_id,
          bill.supplier_name,
          bill.contact,
          item.quantity,
          bill.created_by,
        ]
      );

      insertedItems.push(result.rows[0]);

      if (item.variant_id) {
        await client.query(
          `UPDATE product_variants SET qty = qty + $1 WHERE id = $2`,
          [item.quantity, item.variant_id]
        );
      } else {
        await client.query(
          `UPDATE products SET qty = qty + $1 WHERE id = $2`,
          [item.quantity, item.product_id]
        );
      }
    }

    await client.query("COMMIT");
    res.status(201).json({ ...bill, items: insertedItems });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ message: "Failed to create stock entry bill" });
  } finally {
    client.release();
  }
});

/* ============================================================
   DELETE A WHOLE BILL (cascades to its items)
   DELETE /stock-entries/:id
   ============================================================ */
router.delete("/stock-entries/:id", async (req, res) => {
  try {
    await pool.query(`DELETE FROM stock_entry_bills WHERE id = $1`, [req.params.id]);
    res.json({ message: "Bill deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to delete bill" });
  }
});
router.post("/stock-entries/export", async (req, res) => {
  const { ids } = req.body;

  try {
    const result = await pool.query(
      `
      SELECT
        b.id AS bill_id,
        b.supplier_name,
        b.created_at,
        SUM(se.quantity) AS total_quantity
      FROM stock_entry_bills b
      JOIN stock_entries se ON se.bill_id = b.id
      WHERE ($1::int[] IS NULL OR b.id = ANY($1))
      GROUP BY b.id
      ORDER BY b.id DESC
      `,
      [ids?.length ? ids : null]
    );

    let csv = "Bill ID,Supplier,Date,Total Qty\n";

    result.rows.forEach((r) => {
      csv += `${r.bill_id},${r.supplier_name},${r.created_at},${r.total_quantity}\n`;
    });

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", "attachment; filename=stock.csv");
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Export failed" });
  }
});
module.exports = router;

// In your main server file:
//   const stockEntryRoutes = require("./routes/stockEntries");
//   app.use("/api", stockEntryRoutes);