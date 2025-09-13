const express = require('express');
const router = express.Router();
const pool = require('../db');
const authenticateToken = require('../middleware/auth');
const sendEmail = require('../utils/sendEmail');

// Add Item
router.post('/', authenticateToken, async (req, res) => {
  const { name, quantity, type, purchase_date, shelf_life, expiry_date } = req.body;
  try {
    const result = await pool.query(
      `INSERT INTO items (user_id, name, quantity, type, purchase_date, shelf_life, expiry_date)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [req.user.id, name, quantity, type, purchase_date, shelf_life, expiry_date]
    );

    const newItem = result.rows[0];

    // ✅ Send confirmation email
    await sendEmail(
      req.user.email, // make sure `req.user` has `email` (add it in your JWT if not)
      "Item Added 🛒",
      `Your item "${newItem.name}" (Qty: ${newItem.quantity}) has been added successfully. Expiry: ${newItem.expiry_date}`
    );

    res.json(newItem);
  } catch (err) {
    console.error("Add item error:", err);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Get all items for user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM items WHERE user_id=$1 ORDER BY expiry_date ASC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch items error:", err);
    res.status(500).json({ error: 'Failed to fetch items' });
  }
});

// Get used items for user (must come before /:id route)
router.get('/archived', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM used_items WHERE user_id=$1 ORDER BY used_on DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching used items:', err);
    res.status(500).json({ error: 'Failed to fetch used items' });
  }
});

// Update Item
router.put('/:id', authenticateToken, async (req, res) => {
  const { name, quantity, type, purchase_date, shelf_life, expiry_date } = req.body;
  const { id } = req.params;
  try {
    const result = await pool.query(
      `UPDATE items SET name=$1, quantity=$2, type=$3, purchase_date=$4, shelf_life=$5, expiry_date=$6
       WHERE id=$7 AND user_id=$8 RETURNING *`,
      [name, quantity, type, purchase_date, shelf_life, expiry_date, id, req.user.id]
    );

    const updatedItem = result.rows[0];

    // ✅ Send update notification email
    await sendEmail(
      req.user.email,
      "Item Updated ✏️",
      `Your item "${updatedItem.name}" has been updated successfully. New Expiry: ${updatedItem.expiry_date}`
    );

    res.json(updatedItem);
  } catch (err) {
    console.error("Update item error:", err);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Delete/Use Item (archived via trigger)
router.delete('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      'DELETE FROM items WHERE id=$1 AND user_id=$2 RETURNING *',
      [id, req.user.id]
    );

    if (result.rows.length > 0) {
      const deletedItem = result.rows[0];

      // ✅ Send deletion confirmation email
      await sendEmail(
        req.user.email,
        "Item Used/Deleted 🗑️",
        `Your item "${deletedItem.name}" (Qty: ${deletedItem.quantity}) has been marked as used and archived.`
      );
    }

    res.json({ message: 'Item used and archived successfully' });
  } catch (err) {
    console.error("Delete item error:", err);
    res.status(500).json({ error: 'Failed to delete/use item' });
  }
});

module.exports = router;
