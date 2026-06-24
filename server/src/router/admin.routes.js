const express = require("express");
const pool = require("../config/db");

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

module.exports = router;