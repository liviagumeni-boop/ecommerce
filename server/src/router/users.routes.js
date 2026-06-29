const express = require("express");
const pool = require("../config/db");

const router = express.Router();

/* =========================
   GET LOGGED USER
========================= */
router.get("/me", async (req, res) => {
  try {
    const userId = req.headers.userid;

    if (!userId) {
      return res.status(400).json({ message: "Missing user id" });
    }

    const result = await pool.query(
      `SELECT id, name, email, address, role, created_at
       FROM users
       WHERE id=$1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   GET USER ORDERS
========================= */
router.get("/me/orders", async (req, res) => {
  try {
    const userId = req.headers.userid;

    if (!userId) {
      return res.status(400).json({ message: "Missing user id" });
    }

    const result = await pool.query(
      `SELECT 
        id,
        total,
        status,
        created_at
       FROM orders
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE PROFILE
========================= */
router.put("/me", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { name, email, address } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET name=$1, email=$2, address=$3
       WHERE id=$4
       RETURNING id, name, email, address`,
      [name, email, address, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   UPDATE ADDRESS ONLY
========================= */
router.put("/me/address", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { address } = req.body;

    const result = await pool.query(
      `UPDATE users
       SET address=$1
       WHERE id=$2
       RETURNING id, name, email, address`,
      [address, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* =========================
   CHANGE PASSWORD
========================= */
router.put("/me/password", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { old, new: newPass } = req.body;

    const user = await pool.query(
      "SELECT password FROM users WHERE id=$1",
      [userId]
    );

    if (!user.rows[0]) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.rows[0].password !== old) {
      return res.status(400).json({ message: "Old password incorrect" });
    }

    await pool.query(
      "UPDATE users SET password=$1 WHERE id=$2",
      [newPass, userId]
    );

    res.json({ message: "Password updated" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});
router.get("/admin", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        u.id,
        u.name,
        u.email,
        u.role,
        COUNT(o.id) AS orders_count
      FROM users u
      LEFT JOIN orders o ON o.user_id = u.id
      GROUP BY u.id
      ORDER BY u.id DESC
    `);

    const users = result.rows.map((u) => {
      const orders = Number(u.orders_count || 0);

      let loyalty = orders * 20;
      if (loyalty > 100) loyalty = 100;

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        orders,
        loyalty,
      };
    });

    res.json(users);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err.message });
  }
});
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query("DELETE FROM orders WHERE user_id = $1", [id]);
    await pool.query("DELETE FROM users WHERE id = $1", [id]);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});
module.exports = router;