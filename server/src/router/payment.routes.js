const express = require("express");
const pool = require("../config/db");
const Stripe = require("stripe");

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

/* =========================
   CREATE CHECKOUT SESSION
========================= */
router.post("/create-checkout-session", async (req, res) => {
  try {
    const { items } = req.body;
    const userId = req.headers.userid;

    if (!userId) {
      return res.status(400).json({ message: "Missing user id" });
    }

    // 1. GET REAL PRODUCT DATA FROM DB
    const fullItems = [];

    for (let item of items) {
      const product = await pool.query(
        `SELECT name, sale_price FROM products WHERE id = $1`,
        [item.id]
      );

      const dbItem = product.rows[0];

      fullItems.push({
        id: item.id,
        name: dbItem.name,
        sale_price: dbItem.sale_price,
        qty: item.qty,
      });
    }

    // 2. CALCULATE TOTAL FROM DB DATA
    let calculatedTotal = 0;

    for (let item of fullItems) {
      calculatedTotal += item.sale_price * item.qty;
    }

    // 3. CREATE ORDER
    const order = await pool.query(
      `INSERT INTO orders (user_id, total, status, created_at)
       VALUES ($1, $2, 'pending', NOW())
       RETURNING id`,
      [userId, calculatedTotal]
    );

    const orderId = order.rows[0].id;

    // 4. SAVE ORDER ITEMS
    for (let item of fullItems) {
      await pool.query(
        `INSERT INTO order_items (order_id, product_id, price, quantity)
         VALUES ($1, $2, $3, $4)`,
        [orderId, item.id, item.sale_price, item.qty]
      );
    }

    // 5. STRIPE SESSION
   const session = await stripe.checkout.sessions.create({
  payment_method_types: ["card"],
  mode: "payment",

  // ✅ ONE SINGLE LINE ITEM (cart total)
  line_items: [
    {
      price_data: {
        currency: "eur",
        product_data: {
          name: "Cart Total Purchase",
        },
        unit_amount: Math.round(calculatedTotal * 100),
      },
      quantity: 1,
    },
  ],

  success_url: "http://localhost:5173/payment-success",
  cancel_url: "http://localhost:5173/payment-failed",

  client_reference_id: orderId,
});

    res.json({ url: session.url });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;