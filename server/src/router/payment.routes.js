const express = require("express");
const pool = require("../config/db");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;
    const userId = parseInt(req.headers.userid); // ← parse to integer

    console.log("userId:", userId, "items:", items); // check server terminal

    if (!userId || isNaN(userId)) return res.status(400).json({ message: "Missing user id" });
    if (!items?.length) return res.status(400).json({ message: "Cart is empty" });

    // 1. Fetch real prices from DB
    const fullItems = [];
    for (const item of items) {
      const product = await pool.query(
        `SELECT name, sale_price FROM products WHERE id = $1`,
        [item.id]
      );

      if (!product.rows.length) {
        return res.status(404).json({ message: `Product not found: ${item.id}` });
      }

      const dbItem = product.rows[0];
      fullItems.push({
        id: item.id,
        name: dbItem.name,
        sale_price: Number(dbItem.sale_price),
        qty: item.qty,
      });
    }

    // 2. Calculate total
    const calculatedTotal = fullItems.reduce(
      (sum, item) => sum + item.sale_price * item.qty,
      0
    );

    // 3. Create order
    const order = await pool.query(
      `INSERT INTO orders (user_id, total, status)
       VALUES ($1, $2, 'Pending') RETURNING id`,
      [userId, calculatedTotal]
    );
    const orderId = order.rows[0].id;

    // 4. Create order items
    for (const item of fullItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, price, quantity)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.sale_price, item.qty]
      );
    }

    // 5. Create Stripe embedded session
    // store the orderId on the session so we can update it on confirmation
    const session = await stripe.checkout.sessions.create({
      ui_mode: "embedded_page",
      mode: "payment",
      line_items: fullItems.map((item) => ({
        price_data: {
          currency: "eur",
          product_data: { name: item.name },
          unit_amount: Math.round(item.sale_price * 100),
        },
        quantity: item.qty,
      })),
      metadata: { orderId: String(orderId) },
      return_url: `${process.env.STRIPE_RETURN_URL}?session_id={CHECKOUT_SESSION_ID}`,
    });

    return res.json({ clientSecret: session.client_secret });

  } catch (err) {
    console.error("Payment error FULL:", err.message); // ← paste what this shows
    return res.status(500).json({ message: err.message });
  }
});

// ================= SESSION STATUS =================
// Used by the single CheckoutReturn page (toast-based) instead of
// separate success/failed pages. Order status stays "Pending" —
// not flipped here.
router.get("/session-status", async (req, res) => {
  try {
    const { session_id } = req.query;
    if (!session_id) {
      return res.status(400).json({ message: "Missing session_id" });
    }

    const session = await stripe.checkout.sessions.retrieve(session_id);

    return res.json({
      status: session.status,
      payment_status: session.payment_status,
    });
  } catch (err) {
    console.error("Session status error:", err.message);
    return res.status(500).json({ message: err.message });
  }
});

module.exports = router;