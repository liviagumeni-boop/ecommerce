const express = require("express");
const pool = require("../config/db");
const { encrypt, decrypt } = require("../utils/crypto");
const { invalidateStripeCache } = require("../config/stripe");
const router = express.Router();

/* =========================
   ADMIN DASHBOARD REAL DATA
========================= */
router.get("/dashboard", async (req, res) => {
  try {

    // ================= TOTAL ORDERS =================
    const ordersTotal = await pool.query(`
      SELECT COUNT(*)::int AS total
      FROM orders
    `);

    // ================= STATUS =================
    const ordersStatus = await pool.query(`
      SELECT status, COUNT(*)::int AS value
      FROM orders
      GROUP BY status
    `);

    // ================= REVENUE =================
    const revenue = await pool.query(`
      SELECT COALESCE(SUM(total),0)::float AS revenue
      FROM orders
    `);

    // ================= WEEKLY SALES =================
    const weeklySales = await pool.query(`
      SELECT 
        TO_CHAR(created_at, 'Dy') AS name,
        COUNT(*)::int AS sales
      FROM orders
      GROUP BY TO_CHAR(created_at, 'Dy')
      ORDER BY MIN(created_at)
    `);

    // ================= USERS + LOYALTY =================
const users = await pool.query(`
  SELECT 
    u.email,
   
    COUNT(o.id)::int AS orders
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  WHERE u.role = 'user'
  GROUP BY u.id
  HAVING COUNT(o.id) >= 5
`);
    const usersWithLoyalty = users.rows.map(u => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      orders: u.orders,
      loyalty: Math.min(u.orders * 20, 100)
    }));

    // ================= BEST SELLING (FROM ORDER ITEMS) =================
    const bestSelling = await pool.query(`
      SELECT 
        p.name,
        SUM(oi.quantity)::int AS value
      FROM order_items oi
      JOIN products p ON p.id = oi.product_id
      GROUP BY p.name
      ORDER BY value DESC
      LIMIT 5
    `);

    // ================= OUT OF STOCK =================
const outOfStock = await pool.query(`
  SELECT COUNT(*)::int AS count
  FROM products
  WHERE qty = 0
`);
    res.json({
      ordersTotal: ordersTotal.rows[0].total,
      ordersStatus: ordersStatus.rows,
      revenue: revenue.rows[0].revenue,
      weeklySales: weeklySales.rows,
      users: usersWithLoyalty,
      bestSelling: bestSelling.rows,
      outOfStock: outOfStock.rows[0].count
    });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.get("/settings/stripe", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT stripe_secret_key, stripe_publishable_key, stripe_webhook_secret
       FROM store_settings WHERE id = 1`
    );

    const row = rows[0];
    if (!row) {
      return res.json({ secretKey: null, publishableKey: null, webhookSecret: null });
    }

    const mask = (val) => (val ? `••••••••${val.slice(-4)}` : null);

    res.json({
      secretKey: row.stripe_secret_key ? mask(decrypt(row.stripe_secret_key)) : null,
      publishableKey: row.stripe_publishable_key || null,
      webhookSecret: row.stripe_webhook_secret ? mask(decrypt(row.stripe_webhook_secret)) : null,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});

router.post("/settings/stripe", async (req, res) => {
  try {
    const { secretKey, publishableKey, webhookSecret } = req.body;

    const updates = [];
    const values = [];
    let i = 1;

    if (secretKey) {
      updates.push(`stripe_secret_key = $${i++}`);
      values.push(encrypt(secretKey));
    }
    if (publishableKey) {
      updates.push(`stripe_publishable_key = $${i++}`);
      values.push(publishableKey);
    }
    if (webhookSecret) {
      updates.push(`stripe_webhook_secret = $${i++}`);
      values.push(encrypt(webhookSecret));
    }

    if (!updates.length) {
      return res.status(400).json({ message: "No values provided" });
    }

    values.push(1);
    await pool.query(
      `UPDATE store_settings SET ${updates.join(", ")} WHERE id = $${i}`,
      values
    );

    invalidateStripeCache();

    res.json({ success: true });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;