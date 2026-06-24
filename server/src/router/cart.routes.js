const express = require("express");
const pool = require("../config/db");

const router = express.Router();


// ================= GET USER CART =================
router.get("/:userId", async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        c.id,
        c.quantity,

        p.id AS product_id,
        p.name,
        p.image,
        p.sale_price,

        b.name AS brand

      FROM cart c

      JOIN products p
      ON p.id = c.product_id

      LEFT JOIN brands b
      ON b.id = p.brand_id

      WHERE c.user_id = $1

      ORDER BY c.id DESC
      `,
      [req.params.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
});


// ================= ADD PRODUCT =================
router.post("/", async (req, res) => {
  try {
    const { user_id, product_id } = req.body;

    // kontrollo nëse ekziston
    const existing = await pool.query(
      `
      SELECT *
      FROM cart
      WHERE user_id=$1
      AND product_id=$2
      `,
      [user_id, product_id]
    );

    // nëse ekziston rrit quantity
    if (existing.rows.length > 0) {
      await pool.query(
        `
        UPDATE cart
        SET quantity = quantity + 1
        WHERE user_id=$1
        AND product_id=$2
        `,
        [user_id, product_id]
      );
    }

    // nëse nuk ekziston krijoje
    else {
      await pool.query(
        `
        INSERT INTO cart
        (user_id, product_id, quantity)
        VALUES ($1,$2,1)
        `,
        [user_id, product_id]
      );
    }

    res.json({
      message: "Added to cart",
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      message: err.message,
    });
  }
});


// ================= INCREASE =================
router.put("/increase/:id", async (req, res) => {
  try {
    await pool.query(
      `
      UPDATE cart
      SET quantity = quantity + 1
      WHERE id=$1
      `,
      [req.params.id]
    );

    res.json({
      message: "Quantity increased",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// ================= DECREASE =================
router.put("/decrease/:id", async (req, res) => {
  try {
    await pool.query(
      `
      UPDATE cart
      SET quantity = quantity - 1
      WHERE id=$1
      AND quantity > 1
      `,
      [req.params.id]
    );

    res.json({
      message: "Quantity decreased",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// ================= DELETE ONE PRODUCT =================
router.delete("/:id", async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM cart
      WHERE id=$1
      `,
      [req.params.id]
    );

    res.json({
      message: "Deleted",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});


// ================= CLEAR CART =================
router.delete("/clear/:userId", async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM cart
      WHERE user_id=$1
      `,
      [req.params.userId]
    );

    res.json({
      message: "Cart cleared",
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
});

module.exports = router;