const express = require("express");
const bcrypt = require("bcrypt");
const pool = require("../config/db");
const { validateSignupInput } = require("../validators/authValidator");  
const router = express.Router();

router.post("/signup", async (req, res) => {
  const { name, email, password } = req.body;
  // validate input
  const { isValid, errors } = validateSignupInput({ name, email, password });
  if (!isValid) {
    return res.status(400).json({
      message: Object.values(errors)[0],
      errors,
    });
  }
  try {
    // check user exists
    const exists = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email]
    );

    if (exists.rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // insert user
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, email, role`,
      [name, email, hashedPassword, "user"]
    );

    res.json({
      message: "User created",
      user: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;