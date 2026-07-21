const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { validateName, validateEmail, validatePassword } = require("../validators/authValidator");

// GET /api/users/me
router.get("/me", async (req, res) => {
  try {
    const userId = req.headers.userid;

    const result = await pool.query(
      `
      SELECT
        id,
        name,
        email,
        address,
        phone,
        avatar,
        role,
        created_at
      FROM users
      WHERE id = $1
      `,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me
router.put("/me", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { name, email, address } = req.body;

    const nameError = validateName(name);
    if (nameError) {
      return res.status(400).json({ message: nameError });
    }

    const emailError = validateEmail(email);
    if (emailError) {
      return res.status(400).json({ message: emailError });
    }

    const result = await pool.query(
      `
      UPDATE users
      SET
        name = $1,
        email = $2,
        address = $3,
        updated_at = NOW()
      WHERE id = $4
      RETURNING id,name,email,address
      `,
      [name, email, address, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me/address
router.put("/me/address", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { address } = req.body;

    const result = await pool.query(
      `
      UPDATE users
      SET
        address = $1,
        updated_at = NOW()
      WHERE id = $2
      RETURNING id,address
      `,
      [address, userId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/users/me/password
router.put("/me/password", async (req, res) => {
  try {
    const userId = req.headers.userid;
    const { old, new: newPassword } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!old || !newPassword) {
      return res.status(400).json({ message: "Old and new password are required" });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      return res.status(400).json({ message: passwordError });
    }

    const result = await pool.query(
      `SELECT password FROM users WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(old, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const sameAsOld = await bcrypt.compare(newPassword, user.password);
    if (sameAsOld) {
      return res.status(400).json({ message: "New password must be different from old password" });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    await pool.query(
      `UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2`,
      [hashed, userId]
    );

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

// GET /api/users/me/orders
router.get("/me/orders", async (req, res) => {
  try {
    const userId = req.headers.userid;

    const result = await pool.query(
      `
      SELECT *
      FROM orders
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;