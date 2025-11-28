// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const sendEmail = require('../utils/sendEmail');

// ---------------- Register ----------------
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Name, email, and password are required' });
  }

  try {
    const hashed = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (name, email, password) VALUES ($1,$2,$3) RETURNING *',
      [name, email, hashed]
    );

    const newUser = result.rows[0];

    // Try sending welcome email (non-fatal)
    try {
      await sendEmail(
        newUser.email,
        'Welcome to Grocify 🎉',
        `Hi ${newUser.name}, thanks for registering on Grocify! We're excited to have you onboard.`
      );
    } catch (emailErr) {
      console.error('Registration email error:', emailErr.message);
    }

    res.json({
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error('Registration error:', err);

    // Handle duplicate email (Postgres unique violation)
    if (err.code === '23505') {
      return res.status(400).json({ error: 'Email already registered' });
    }

    res.status(500).json({ error: 'User registration failed' });
  }
});

// ---------------- Login ----------------
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (userResult.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(400).json({ error: 'Incorrect password' });
    }

    // ⚠️ IMPORTANT: Include email (and name) in JWT so req.user.email is available
    const tokenPayload = {
      id: user.id,
      email: user.email,
      name: user.name,
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '1d',
    });

    // Try sending login notification email (non-fatal)
    try {
      await sendEmail(
        user.email,
        'Login Successful ✅',
        `Hi ${user.name}, you just logged in to Grocify at ${new Date().toLocaleString()}.`
      );
    } catch (emailErr) {
      console.error('Login email error:', emailErr.message);
    }

    // Keep response simple to not break existing frontend
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

module.exports = router;
