// backend/routes/items.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// ---------------- Add Item ----------------
router.post('/', authenticateToken, async (req, res) => {
  const { name, quantity, type, purchase_date, shelf_life, expiry_date } = req.body;

  if (!name || !quantity) {
    return res.status(400).json({ error: 'Name and quantity are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO items (user_id, name, quantity, type, purchase_date, shelf_life, expiry_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, name, quantity, type, purchase_date, shelf_life, expiry_date]
    );

    const newItem = result.rows[0];

    // Send confirmation email (non-blocking)
    try {
      await sendEmail(
        req.user.email,
        'Item Added 🛒',
        `Your item "${newItem.name}" (Qty: ${newItem.quantity}) has been added successfully. Expiry: ${newItem.expiry_date}`
      );
    } catch (emailErr) {
      console.error('Add item email error:', emailErr.message);
    }

    res.json(newItem);
  } catch (err) {
    console.error('Add item error:', err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// ---------------- Get All Items ----------------
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM items WHERE user_id = $1 ORDER BY expiry_date ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Fetch items error:', err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// ---------------- Get Archived (Used) Items ----------------
// FIXED: archived_items has column archived_at, not used_on
router.get('/archived', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT *
       FROM archived_items
       WHERE user_id = $1
       ORDER BY archived_at DESC`,   // ✅ FIXED COLUMN
      [req.user.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching archived items:', err);
    res.status(500).json({ error: 'Failed to fetch archived items' });
  }
});

// ---------------- Update Item ----------------
router.put('/:id', authenticateToken, async (req, res) => {
  const { name, quantity, type, purchase_date, shelf_life, expiry_date } = req.body;
  const { id } = req.params;

  try {
    const result = await pool.query(
      `UPDATE items
       SET name = $1,
           quantity = $2,
           type = $3,
           purchase_date = $4,
           shelf_life = $5,
           expiry_date = $6
       WHERE id = $7 AND user_id = $8
       RETURNING *`,
      [name, quantity, type, purchase_date, shelf_life, expiry_date, id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const updatedItem = result.rows[0];

    // Send update email
    try {
      await sendEmail(
        req.user.email,
        'Item Updated ✏️',
        `Your item "${updatedItem.name}" has been updated successfully. New Expiry: ${updatedItem.expiry_date}`
      );
    } catch (emailErr) {
      console.error('Update item email error:', emailErr.message);
    }

    res.json(updatedItem);
  } catch (err) {
    console.error('Update item error:', err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// ---------------- Delete / Use Item (archive trigger) ----------------
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const result = await pool.query(
      'DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const deletedItem = result.rows[0];

    // Send deletion email
    try {
      await sendEmail(
        req.user.email,
        'Item Used/Deleted 🗑️',
        `Your item "${deletedItem.name}" (Qty: ${deletedItem.quantity}) has been marked as used and archived.`
      );
    } catch (emailErr) {
      console.error('Delete item email error:', emailErr.message);
    }

    res.json({ message: 'Item used and archived successfully' });
  } catch (err) {
    console.error('Delete item error:', err);
    res.status(500).json({ error: 'Failed to delete/use item' });
  }
});

module.exports = router;
