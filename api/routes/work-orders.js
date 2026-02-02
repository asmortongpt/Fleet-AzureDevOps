
const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/api/work-orders', async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM work_orders ORDER BY created_at DESC');
    res.json({ success: true, data: result.rows, count: result.rows.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/api/work-orders', async (req, res) => {
  try {
    const { vehicle_id, description, status, priority } = req.body;
    const result = await db.query(
      'INSERT INTO work_orders (vehicle_id, description, status, priority) VALUES ($1, $2, $3, $4) RETURNING *',
      [vehicle_id, description, status || 'open', priority || 'medium']
    );
    res.status(201).json({ success: true, data: result.rows[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
