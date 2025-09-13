const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// Register
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  try {
    const hashed = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *',
      [name, email, hashed]
    );

    const newUser = result.rows[0];

    // ✅ Send welcome email
    await sendEmail(
      newUser.email,
      "Welcome to Grocify 🎉",
      `Hi ${newUser.name}, thanks for registering on Grocify! We're excited to have you onboard.`
    );

    res.json({ user: newUser });
  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: 'User registration failed' });
  }
});

// Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await pool.query('SELECT * FROM users WHERE email=$1', [email]);
    if (user.rows.length === 0) return res.status(400).json({ error: 'User not found' });

    const match = await bcrypt.compare(password, user.rows[0].password);
    if (!match) return res.status(400).json({ error: 'Incorrect password' });

    const token = jwt.sign(
      { id: user.rows[0].id },
      process.env.JWT_SECRET,
      { expiresIn: '1d' }
    );

    // ✅ Send login notification email
    await sendEmail(
      email,
      "Login Successful ✅",
      `Hi ${user.rows[0].name}, you just logged in to Grocify at ${new Date().toLocaleString()}.`
    );

    res.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
